import { useState } from 'react'
import { Container, Stack, Box, Typography, Button } from '@mui/material'

function App() {
  const [count, setCount] = useState(0)

  return (
      <Container>
        <Stack>
          <Box>
            <Typography variant="h1">Do Something Useful</Typography>
            <Typography variant="h2">{count}</Typography>
            <Button onClick={() => setCount(count + 1)}>Count</Button>
          </Box>
        </Stack>
      </Container>
  )
}

export default App
