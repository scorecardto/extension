import { useState } from "react";
import "./App.css";
import Main from "./components/main/Main";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Main />
    </div>
  );
}

export default App;
