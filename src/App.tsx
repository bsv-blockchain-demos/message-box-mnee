import { Container, Stack } from '@mui/material'
import Header from './components/Header'
import FundMetanet from './pages/FundMetanet'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Menu from './components/Menu'
import Balance from './pages/Tokens'
import P2Identity from './pages/P2Identity'
import P2Address from './pages/P2Address'

function App() {
  return (
    <Container>
      <BrowserRouter>
        <Stack spacing={3} alignItems="center">
          <Header />
          <Menu />
          <Routes>
            <Route path="/tokens" element={<Balance />} />
            <Route path="/fund" element={<FundMetanet />} />
            <Route path="/" element={<P2Identity />} />
            <Route path="/address" element={<P2Address />} />
          </Routes>
        </Stack>
      </BrowserRouter>
    </Container>
  )
}

export default App
