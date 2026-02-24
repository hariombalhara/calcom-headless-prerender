import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App";
import AllRoutingDataInParams from "./AllRoutingDataInParams";
import "./index.css";

const Layout = () => (
  <>
    <nav style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
      <Link to="/">Home (Form-based prerender)</Link>
      <Link to="/all-routing-data-in-params">All Routing Data in Params</Link>
    </nav>
    <Routes>
      <Route path="/" element={
        <>
          <App />
          <h1>General Instructions to use prerendering</h1>
          <ul style={{ textAlign: "left" }}>
            <li>
              Call{" "}
              <code>{`cal('prerender', {
          calLink: 'router?form=FORM_ID&FIELD_VALUE_PAIRS',
          type: "modal",
          pageType: "team.event.booking.slots"
        })`}</code>{" "}
              whenever all the fields required by the routing rules are available. A
              prerender instruction renders a new iframe destroying the previous one
              if exists
            </li>
            <li>
              Keep calling the <code>prerender</code> instruction whenever any of
              those routing fields change. MUST AVOID CALLING PRERENDER ON EVERY
              CHARACTER CHANGE, as that sends too many requests to the server. Instead ensure that you use focus out event to assume that the field is filled
            </li>
          </ul>
        </>
      } />
      <Route path="/all-routing-data-in-params" element={<AllRoutingDataInParams />} />
    </Routes>
  </>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </React.StrictMode>
);
