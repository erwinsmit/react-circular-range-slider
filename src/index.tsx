import * as React from "react";
import { render } from "react-dom";
import { RangeSlider } from "./RangeSlider.tsx";

const App = () => <RangeSlider maxValue={800} />;

render(<App />, document.getElementById("root"));
