import "./App.css";
import { useEffect } from "react";

import React, { useState } from "react";
const formId="56250726-d41d-4140-af43-551cac8892a5"
const calOrigin="https://a7b1-2a01-4f8-212-75a-00-2.ngrok-free.app"
// This is same as you get from Embed Snippet Generator on Cal.com with the difference that it has props that can configure it from outside
const EmbedCta = ({
  calLink,
  calOrigin,
  children,
}: {
  calLink: string;
  calOrigin: string;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    (async function () {
      window.Cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
      window.Cal("on", {
        action: "bookingSuccessfulV2",
        callback(event) {
          let b = event.detail.data;
          console.log(b);
        },
      });
    })();
  }, []);

  return (
    <button
      data-cal-namespace="headl"
      data-cal-link={calLink}
      data-cal-origin={calOrigin}
      // data-cal-origin="https://i.cal.com"
      data-cal-config='{"layout":"month_view"}'
    >
      {children}
    </button>
  );
};

const App = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companySize: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (event) => {
    // You can submit the data to your server as well or to any other third party here
    console.log(formData);
    // Ensure that form doesn't redirect to the action and instead lets us show the embed
    return event.preventDefault();
  };

  const calLink = (() => {
    const searchParams = new URLSearchParams();

    // "firstName" and "lastName" are the identifier for the name field in Routing Form
    searchParams.set("firstName", formData.firstName);
    searchParams.set("lastName", formData.lastName);
    searchParams.set("phone", formData.phone);

    // "email" is the identifier for the email field in Routing Form
    searchParams.set("email", formData.email);
    // "companySize" is the identifier for the Company Size field in Routing Form
    // Encode if there are any special parameters e.g. companySize has 2000+ option where + is a special character
    searchParams.set("companySize", encodeURIComponent(formData.companySize));

    return `router?form=${formId}&${searchParams.toString()}`;
  })();

  return (
    <div style={{ width: "300px", margin: "auto" }}>
      <h2>Demo - Headless Router with User Form</h2>
      <p>Schedule a demo</p>
      <p>
        On succesful form submission with 10-100 company size it routes to an
        event booking page
      </p>
      <p>
        Once that event is booked it redirects to a Custom
        Url(https://cal.com/scheduling/feature/routing-forms) with a lot of
        useful query parameters{" "}
      </p>
      <form onSubmit={handleSubmit} method="GET">
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          placeholder="First Name"
          required
        />

        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          placeholder="Last Name"
          required
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Work email"
          required
        />

        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Phone"
          required
        />
        <select
          name="companySize"
          value={formData.companySize}
          onChange={handleInputChange}
          required
        >
          <option value="" disabled>
            Company size
          </option>
          <option value="< 10">{"1-10"}</option>
          <option value="10-100">10-100</option>
          <option value="100-500">100-500</option>
          <option value="> 500">{">500"}</option>
        </select>
        {/* Use calOrigin of your organization e.g. https://acme.cal.com*/}
        <EmbedCta calLink={calLink} calOrigin={calOrigin}>
          Book a Demo
        </EmbedCta>
      </form>
    </div>
  );
};

export default App;
