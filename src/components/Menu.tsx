import { Button, Stack, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Menu() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Stack 
      direction="row" 
      spacing={2} 
      sx={{ 
        padding: 2,
        backgroundColor: theme.palette.mode === 'dark' ? '#242424' : '#f5f5f5',
        borderRadius: 1
      }}
    >
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/')}
      >
        Balance & History
      </Button>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/fund')}
      >
        Import Funds
      </Button>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/address')}
      >
        Pay Address
      </Button>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/pay')}
      >
        Identity Payment
      </Button>
    </Stack>
  );
}

export default Menu;
