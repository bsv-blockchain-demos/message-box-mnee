import { Stack, Box, useTheme, Button } from '@mui/material'
import { NumberField } from '@base-ui-components/react/number-field'
import { toast } from 'react-toastify'
import styles from './amountSelector.module.css'
import { useRef, useState, useEffect } from 'react'
import { MNEEConfig } from '@mnee/ts-sdk'

// Styled dollar sign component
const DollarSign = () => {
    const theme = useTheme()
    return <span style={{ 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 8px', 
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5', 
    borderTopLeftRadius: '4px', 
    borderBottomLeftRadius: '4px',
    borderRight: '1px solid ' + (theme.palette.mode === 'dark' ? '#666' : '#ddd'),
    color: theme.palette.mode === 'dark' ? 'white' : '#666'
  }}>
    $
  </span>
}

interface AmountSelectorProps {
  readonly setAmount: (amount: number) => void;
  readonly balance?: number;
  readonly config?: MNEEConfig;
}

function AmountSelector({ setAmount, balance, config }: AmountSelectorProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [debouncedValue, setDebouncedValue] = useState<string>('');
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const formatValueToFiveDecimals = (value: string): string => {
        // Split the value into whole and decimal parts
        const parts = value.split('.');
        
        // If there's a decimal part and it's longer than 5 digits, truncate it
        if (parts.length > 1 && parts[1].length > 5) {
            return `${parts[0]}.${parts[1].substring(0, 5)}`;
        }
        
        return value;
    };

    const calculateMaxAmount = (): number => {
        if (!balance || !config || !config.fees) return 0;
        
        // Convert balance to atomic units for fee calculation
        const balanceAtomic = balance;
        
        // Find the appropriate fee tier for the maximum possible amount
        // We'll iterate through possible amounts to find the maximum that fits
        let maxAmount = 0;
        for (let amount = balanceAtomic; amount > 0; amount--) {
            const feeTier = config.fees.find(tier => 
                amount >= tier.min && amount <= tier.max
            );
            if (feeTier && amount + feeTier.fee <= balanceAtomic) {
                maxAmount = amount;
                break;
            }
        }
        
        // Convert back to USD amount (divide by 100000)
        return maxAmount / 100000;
    };

    const handleMaxClick = () => {
        const maxAmount = calculateMaxAmount();
        if (maxAmount > 0) {
            setInputValue(maxAmount.toString());
            setDebouncedValue(maxAmount.toString());
            setAmount(maxAmount);
        } else {
            toast.error('Unable to calculate maximum amount');
        }
    };

    // Debounce the validation and setting of amount
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            setAmount(0);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
            if (debouncedValue === '') return;
            
            const value = Number(debouncedValue);
            
            // Validate the numeric range after debouncing
            if (value < 0.00001 || value > 1000) {
                toast.error('Amount must be between 0.00001 and 1000');
                return;
            }
            
            setAmount(value);
        }, 2000); // 500ms debounce time

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [debouncedValue, setAmount]);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Format the input value to have max 5 decimal places
        const formattedValue = formatValueToFiveDecimals(event.target.value);
        
        // If the formatted value is different from the input, update the input
        if (formattedValue !== event.target.value && inputRef.current) {
            inputRef.current.value = formattedValue;
        }
        
        // Update the input value immediately for display
        setInputValue(formattedValue);
        
        // Update the debounced value to trigger validation after delay
        setDebouncedValue(formattedValue);
    };

    return (
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
            <NumberField.Root className={styles.Field}>
                <NumberField.ScrubArea className={styles.ScrubArea}>
                    <NumberField.ScrubAreaCursor className={styles.ScrubAreaCursor} />
                </NumberField.ScrubArea>
                <NumberField.Group className={styles.Group}>
                    <DollarSign />
                    <NumberField.Input
                        ref={inputRef}
                        onChange={onChange}
                        className={styles.Input}
                        step="0.00001"
                        min="0.00001"
                        max="1000"
                        placeholder={inputValue === '' ? "0.00000" : ""}
                        value={inputValue}
                        style={{ 
                            fontSize: '1.5rem',
                            width: `120px`
                        }}
                    />
                </NumberField.Group>
            </NumberField.Root>
        </Box>
        <Button 
            variant="outlined" 
            size="small" 
            onClick={handleMaxClick}
            disabled={!balance || !config}
        >
            Max
        </Button>
      </Stack>
  )
}

export default AmountSelector
