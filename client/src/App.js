import React from "react";
import { Route, Switch } from "react-router-dom";
import Join from "./components/Join";
import Session from "./components/Session";

function App() {
  return (
    <div className="App">
      <Switch>
        <Route exact path="/" component={Join} />
        <Route path="/session" component={Session} />
      </Switch>
    </div>
  );
}

export default App;
