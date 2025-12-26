import React from "react";
import ReactDOM from "react-dom/client";
import PreflopQuizApp from "/App.jsx";
import Home from "./home.jsx";

import "/index.css";

var _jsxFileName = "C:/Users/taked/NashLab/src/main.jsx";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="quiz" element={<PreflopQuizApp />}></Route>      
    </Routes>
  </React.StrictMode>

);