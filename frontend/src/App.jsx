import './App.css'
import {Routes,Router,Route} from 'react-router-dom'
import Home from './Home'
import Result from './Result'
function App() {

  return (
    <Routes>
      <Route path='/' element={<Home/>}></Route>
      <Route path='/result' element={<Result/>}></Route>
    </Routes>
  )
}

export default App
