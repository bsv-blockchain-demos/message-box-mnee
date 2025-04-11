import { useState } from 'react'
import './App.css'
import { Container, Stack, Box, Typography } from '@mui/material'

function App() {
  const [count, setCount] = useState(0)

  return (
      <Container>
        <Stack>
          <Box>
            <Typography>Do Something Useful</Typography>
          </Box>
        </Stack>
      </Container>
  )
}

export default App
