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
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
        borderRadius: 1
      }}
    >
      {[
        { path: '/', label: 'Pay Identity' },
        { path: '/tokens', label: 'Tokens' },
        { path: '/fund', label: 'Get Funds' },
        { path: '/address', label: 'Pay Address' }
      ].map((item) => (
        <Button
          key={item.path}
          onClick={() => navigate(item.path)}
          sx={{
            backgroundColor: location.pathname === item.path ? 
              theme.palette.primary.main + '33' : 'transparent',
            color: location.pathname === item.path ? 
              theme.palette.primary.main : theme.palette.text.primary
          }}
        >
          {item.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}

export default Menu;
