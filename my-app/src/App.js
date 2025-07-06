import { BrowserRouter , Routes , Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Repo from "./pages/main.jsx";
import Commit from "./pages/commits.jsx";
function App(){
  return(
    <BrowserRouter>
  <Routes>
    <Route path="/" element = {<Repo />} />
    <Route path="/login" element = {<Home />} />
    <Route path="/commits/:repoName" element = {<Commit />} />
  </Routes>
  </BrowserRouter>
  )
}
export default App;
