import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <h1>General Instructions to use prerendering</h1>
    <ul style={{ textAlign: "left" }}>
      <li>Call <code>{`cal('prerender', {
          calLink: 'router?form=FORM_ID&FIELD_VALUE_PAIRS',
          type: "modal",
          pageType: "team.event.booking.slots"
        })`}</code> whenever all the fields required by the routing rules are filled. A prerender instruction renders a new iframe destorying the previous one if exists</li>
      <li>Keep calling the <code>prerender</code> instruction whenever any of those routing fields change. MUST AVOID CALLING PRERENDER ON EVERY CHARACTER CHANGE</li>
      <li>On the CTA keep the code same as earlier i.e. <code>data-cal-link="router?form=FORM_ID&FIELD_VALUE_PAIRS"</code></li>
    </ul>

  </React.StrictMode>
);
