import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DataGenerator } from './tools/DataGenerator'
import { TextToolbox } from './tools/TextToolbox'
import { Converters } from './tools/Converters'
import { DiffCompare } from './tools/DiffCompare'
import { CodeUtils } from './tools/CodeUtils'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/data-generator" replace />} />
          <Route path="/data-generator" element={<DataGenerator />} />
          <Route path="/text-toolbox" element={<TextToolbox />} />
          <Route path="/converters" element={<Converters />} />
          <Route path="/diff-compare" element={<DiffCompare />} />
          <Route path="/code-utils" element={<CodeUtils />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
