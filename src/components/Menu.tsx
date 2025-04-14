import { Button, ButtonGroup, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Menu() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <ButtonGroup 
    variant="text" 
    size="large"
      color="primary" 
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? '#242424' : '#eaeaea',
        borderRadius: 1
      }}
    >
      <Button 
        onClick={() => navigate('/')}
      >
        Identity Payment
      </Button>
      <Button 
        onClick={() => navigate('/tokens')}
      >
        Tokens
      </Button>
      <Button 
        onClick={() => navigate('/fund')}
      >
        Get Funds
      </Button>
      <Button 
        onClick={() => navigate('/address')}
      >
        Pay Address
      </Button>
    </ButtonGroup>
  )
}

export default Menu;
