import React from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import ConfigGate from './components/ConfigGate'
import Instrumentation from './components/Instrumentation'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import CartScreen from './screens/CartScreen'
import ProductScreen from './screens/ProductScreen'

export default function App() {
  return (
    <ConfigGate>
      <Instrumentation />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/product/:id" element={<ProductScreen />} />
        </Route>
      </Routes>
    </ConfigGate>
  )
}
