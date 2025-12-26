var _jsxFileName = "C:/Users/taked/NashLab/src/main.jsx";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PreflopQuizApp from "./App.jsx";
import Home from "./home.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<PreflopQuizApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);



// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <Home />
//   </React.StrictMode>
// );

// import React from "react";
// import ReactDOM from "react-dom/client";
// import PreflopQuizApp from "./App.jsx";
// import Home from "./home.jsx";

// import "./index.css";

// var _jsxFileName = "C:/Users/taked/NashLab/src/main.jsx";
// import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
