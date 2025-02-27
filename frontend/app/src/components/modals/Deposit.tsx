import {
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { number, object } from 'yup';
import { useFormik } from 'formik';

import { IDepositForm } from '../../constants/oven-operations';
import { BUTTON_TXT } from '../../constants/swap';
import { cTezError, deposit } from '../../contracts/ctez';
import { logger } from '../../utils/logger';

import Button from '../button/Button';
import { TezIcon } from '../icons';
import { AllOvenDatum } from '../../interfaces';
import { useTxLoader } from '../../hooks/utilHooks';
import { useWallet } from '../../wallet/hooks';
import { useUserBalance } from '../../api/queries';
import { formatNumber } from '../../utils/numbers';

interface IDepositProps {
  isOpen: boolean;
  onClose: () => void;
  oven: AllOvenDatum | null;
}

const Deposit: React.FC<IDepositProps> = ({ isOpen, onClose, oven }) => {
  const toast = useToast();
  const [{ pkh: userAddress }] = useWallet();
  const text1 = useColorModeValue('text1', 'darkheading');
  const text2 = useColorModeValue('text2', 'darkheading');
  const inputbg = useColorModeValue('darkheading', 'textboxbg');
  const handleProcessing = useTxLoader();
  const text4Text4 = useColorModeValue('text4', 'text4');
  const { data: balance } = useUserBalance(userAddress);

  const getRightElement = useCallback(() => {
    return (
      <InputRightElement backgroundColor="transparent" w={24} color={text2}>
        <TezIcon height={28} width={28} />
        <Text fontWeight="500" mx={2}>
          tez
        </Text>
      </InputRightElement>
    );
  }, [text2]);

  const { t } = useTranslation(['common']);
  const initialValues: any = {
    amount: '',
  };

  const maxValue = (): number => balance?.xtz || 0.0;

  const validationSchema = object().shape({
    amount: number()
      .min(0.000001)
      .max(maxValue(), `${t('insufficientBalance')}`)
      .required(t('required')),
  });

  const handleFormSubmit = async (data: IDepositForm) => {
    if (oven?.value.address) {
      try {
        const result = await deposit(oven.value.address, data.amount);
        handleProcessing(result);
        if (result) {
          toast({
            description: t('txSubmitted'),
            status: 'success',
          });
        }
      } catch (error) {
        logger.error(error);
        const errorText = cTezError[error.data[1].with.int as number] || t('txFailed');
        toast({
          description: errorText,
          status: 'error',
        });
      }
    }
  };

  const { values, handleChange, handleSubmit, isSubmitting, errors, ...formik } = useFormik({
    initialValues,
    validationSchema,
    onSubmit: handleFormSubmit,
  });

  const { buttonText, errorList } = useMemo(() => {
    const errorListLocal = Object.values(errors);
    if (values.amount) {
      if (errorListLocal.length > 0) {
        return { buttonText: errorListLocal[0], errorList: errorListLocal };
      }

      return { buttonText: BUTTON_TXT.DEPOSIT, errorList: errorListLocal };
    }

    return { buttonText: BUTTON_TXT.ENTER_AMT, errorList: errorListLocal };
  }, [errors, values.amount]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <ModalHeader color={text1} fontWeight="500">
            Deposit Tezos
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="to-input-amount" mt={2} mb={6} w="100%">
              <InputGroup>
                <Input
                  type="number"
                  name="amount"
                  id="amount"
                  lang="en-US"
                  color={text2}
                  bg={inputbg}
                  value={values.amount}
                  onChange={handleChange}
                  placeholder="0.0"
                />
                {getRightElement()}
              </InputGroup>
              {typeof balance !== 'undefined' && (
                <Text color={text4Text4} fontSize="xs" mt={1}>
                  Balance: {formatNumber(balance.xtz, 0)}{' '}
                  <Text
                    as="span"
                    cursor="pointer"
                    color="#e35f5f"
                    onClick={() => formik.setFieldValue('amount', formatNumber(balance.xtz, 0))}
                  >
                    (Max)
                  </Text>
                </Text>
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              w="100%"
              variant="outline"
              type="submit"
              disabled={isSubmitting || errorList.length > 0}
              isLoading={isSubmitting}
            >
              {buttonText}
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default Deposit;
