
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "/api";

const initialBooking = {
  patientName: "",
  patientPhone: "",
  doctorId: "",
  surgeryId: "",
  appointmentDate: "",
  appointmentTime: "",
};

function App() {
  const [hospitals, setHospitals] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [hospitalSearch, setHospitalSearch] = useState("");
  const [surgerySearch, setSurgerySearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [surgeryLoading, setSurgeryLoading] = useState(true);
  const [doctorLoading, setDoctorLoading] = useState(true);

  const [hospitalError, setHospitalError] = useState("");
  const [surgeryError, setSurgeryError] = useState("");
  const [doctorError, setDoctorError] = useState("");

  const [booking, setBooking] = useState(initialBooking);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState(false);

  // My Appointments state
  const [lookupPhone, setLookupPhone] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/hospitals`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setHospitals)
      .catch(() => setHospitalError("Unable to load hospitals."))
      .finally(() => setHospitalLoading(false));

    fetch(`${API_URL}/surgeries`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setSurgeries)
      .catch(() => setSurgeryError("Unable to load surgeries."))
      .finally(() => setSurgeryLoading(false));

    fetch(`${API_URL}/doctors`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setDoctors)
      .catch(() => setDoctorError("Unable to load doctors."))
      .finally(() => setDoctorLoading(false));
  }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    const query = hospitalSearch.trim().toLowerCase();

    return (
      !query ||
      hospital.name?.toLowerCase().includes(query) ||
      hospital.city?.toLowerCase().includes(query) ||
      hospital.location?.toLowerCase().includes(query) ||
      hospital.state?.toLowerCase().includes(query)
    );
  });

  const filteredSurgeries = surgeries.filter((surgery) => {
    const query = surgerySearch.trim().toLowerCase();

    return (
      !query ||
      surgery.surgeryName?.toLowerCase().includes(query) ||
      surgery.surgeryType?.toLowerCase().includes(query) ||
      surgery.hospitalName?.toLowerCase().includes(query) ||
      surgery.city?.toLowerCase().includes(query) ||
      surgery.state?.toLowerCase().includes(query)
    );
  });

  const filteredDoctors = doctors.filter((doctor) => {
    const query = doctorSearch.trim().toLowerCase();

    return (
      !query ||
      doctor.doctorName?.toLowerCase().includes(query) ||
      doctor.specialization?.toLowerCase().includes(query) ||
      doctor.qualification?.toLowerCase().includes(query) ||
      doctor.hospital?.name?.toLowerCase().includes(query)
    );
  });

  const formatCost = (cost) => {
    if (cost === null || cost === undefined || cost === "") {
      return "Cost not provided";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(cost));
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;

    setBooking((previous) => ({
      ...previous,
      [name]: value,
    }));

    setBookingMessage("");
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setBookingMessage("");
    setBookingError(false);

    if (
      !booking.patientName.trim() ||
      !booking.patientPhone.trim() ||
      !booking.doctorId ||
      !booking.surgeryId ||
      !booking.appointmentDate ||
      !booking.appointmentTime
    ) {
      setBookingError(true);
      setBookingMessage("Please complete all required fields.");
      return;
    }

    if (!/^[0-9]{10}$/.test(booking.patientPhone.trim())) {
      setBookingError(true);
      setBookingMessage("Enter a valid 10-digit phone number.");
      return;
    }

    const selectedDoctor = doctors.find(
      (doctor) => String(doctor.id) === booking.doctorId
    );

    const selectedSurgery = surgeries.find(
      (surgery) => String(surgery.id) === booking.surgeryId
    );

    if (!selectedDoctor || !selectedSurgery) {
      setBookingError(true);
      setBookingMessage("Select a valid doctor and surgery.");
      return;
    }

    if (
      selectedDoctor.availability?.toLowerCase() !== "available" ||
      selectedSurgery.availability?.toLowerCase() !== "available"
    ) {
      setBookingError(true);
      setBookingMessage(
        "The selected doctor or surgery is not marked available."
      );
      return;
    }

    setBookingLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/appointments/doctor/${booking.doctorId}/surgery/${booking.surgeryId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: booking.patientName.trim(),
            patientPhone: booking.patientPhone.trim(),
            appointmentDate: booking.appointmentDate,
            appointmentTime: booking.appointmentTime,
            status: "Pending",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Booking failed (HTTP ${response.status}).`);
      }

      const savedAppointment = await response.json();

      setBookingMessage(
        `Appointment request submitted! Booking ID: ${savedAppointment.id}. Status: ${savedAppointment.status}.`
      );
      setBookingError(false);

      // Make the new booking available in My Appointments.
      setLookupPhone(booking.patientPhone.trim());
      setBooking(initialBooking);
    } catch (error) {
      setBookingError(true);
      setBookingMessage(
        error.message || "Unable to connect to the backend."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAppointmentLookup = async (event) => {
    event.preventDefault();
    setLookupMessage("");
    setLookupError(false);
    setAppointments([]);
    setHasSearched(false);

    const phone = lookupPhone.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
      setLookupError(true);
      setLookupMessage("Enter a valid 10-digit phone number.");
      return;
    }

    setLookupLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/appointments/patient/${encodeURIComponent(phone)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed (HTTP ${response.status}).`);
      }

      const data = await response.json();

      setAppointments(data);
      setHasSearched(true);

      if (data.length === 0) {
        setLookupMessage("No appointments found for this phone number.");
      }
    } catch (error) {
      setLookupError(true);
      setLookupMessage(
        error.message || "Unable to retrieve appointments."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parts = date.split("-");
    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const statusClass = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "confirmed") return "status-confirmed";
    if (normalized === "cancelled" || normalized === "canceled") {
      return "status-cancelled";
    }
    if (normalized === "completed") return "status-completed";

    return "status-pending";
  };

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="surgifind">
      <header className="navbar">
        <a className="brand" href="#top">
          <span className="brand-icon">✚</span> SurgiFind
        </a>

        <nav className="nav-links">
          <a href="#hospitals">Hospitals</a>
          <a href="#surgeries">Surgeries</a>
          <a href="#doctors">Doctors</a>
          <a href="#booking">Book Appointment</a>
          <a href="#my-appointments">My Appointments</a>
        </nav>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <p className="eyebrow">YOUR HEALTHCARE, SIMPLIFIED</p>
          <h1>Find hospitals, surgeries and doctors.</h1>
          <p className="hero-description">
            Explore healthcare options, compare estimated surgery costs,
            discover doctors, and request appointments in one place.
          </p>

          <div className="hero-actions">
            <a className="primary-link" href="#hospitals">
              Explore hospitals
            </a>
            <a className="secondary-link" href="#surgeries">
              Explore surgeries
            </a>
            <a className="secondary-link" href="#booking">
              Book appointment
            </a>
          </div>
        </section>

        {/* HOSPITALS */}
        <section className="content-section" id="hospitals">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE HEALTHCARE</p>
              <h2>Hospitals</h2>
            </div>
            <span className="result-count">
              {hospitalLoading
                ? "Loading..."
                : `${filteredHospitals.length} results`}
            </span>
          </div>

          <div className="section-search">
            <input
              type="search"
              placeholder="Search hospitals by name, city, or location..."
              value={hospitalSearch}
              onChange={(event) => setHospitalSearch(event.target.value)}
            />
          </div>

          {hospitalLoading && <p className="message">Loading hospitals...</p>}
          {hospitalError && <p className="error-message">{hospitalError}</p>}

          {!hospitalLoading &&
            !hospitalError &&
            filteredHospitals.length === 0 && (
              <p className="message">No matching hospitals found.</p>
            )}

          <div className="hospital-grid">
            {filteredHospitals.map((hospital) => (
              <article className="hospital-card" key={hospital.id}>
                <div className="hospital-symbol">✚</div>
                <div className="hospital-details">
                  <h3>{hospital.name}</h3>
                  <p>{hospital.location}, {hospital.city}</p>
                  <p>{hospital.state}</p>
                  {hospital.contactNumber && (
                    <a href={`tel:${hospital.contactNumber}`}>
                      ☎ {hospital.contactNumber}
                    </a>
                  )}
                </div>
                <span className="hospital-badge">Hospital</span>
              </article>
            ))}
          </div>
        </section>

        {/* SURGERIES */}
        <section className="content-section surgery-section" id="surgeries">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SURGERY DISCOVERY</p>
              <h2>Explore Surgeries</h2>
            </div>
            <span className="result-count">
              {surgeryLoading
                ? "Loading..."
                : `${filteredSurgeries.length} results`}
            </span>
          </div>

          <div className="section-search">
            <input
              type="search"
              placeholder="Search by surgery, type, hospital, or city..."
              value={surgerySearch}
              onChange={(event) => setSurgerySearch(event.target.value)}
            />
          </div>

          {surgeryLoading && <p className="message">Loading surgeries...</p>}
          {surgeryError && <p className="error-message">{surgeryError}</p>}

          {!surgeryLoading &&
            !surgeryError &&
            filteredSurgeries.length === 0 && (
              <p className="message">No surgeries found.</p>
            )}

          <div className="surgery-grid">
            {filteredSurgeries.map((surgery) => (
              <article className="surgery-card" key={surgery.id}>
                <div className="surgery-card-top">
                  <div className="surgery-symbol">✚</div>
                  <span className="surgery-type">
                    {surgery.surgeryType || "Surgery"}
                  </span>
                </div>

                <h3>{surgery.surgeryName || "Unnamed surgery"}</h3>

                <div className="surgery-info">
                  <p>
                    <span>Hospital</span>
                    <strong>
                      {surgery.hospitalName ||
                        surgery.hospital?.name ||
                        "Not specified"}
                    </strong>
                  </p>
                  <p>
                    <span>Location</span>
                    <strong>
                      {[surgery.city, surgery.state]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </strong>
                  </p>
                  <p>
                    <span>Estimated cost</span>
                    <strong className="surgery-cost">
                      {formatCost(surgery.estimatedCost)}
                    </strong>
                  </p>
                  <p>
                    <span>Surgery date</span>
                    <strong>{surgery.surgeryDate || "Not scheduled"}</strong>
                  </p>
                </div>

                <div className="availability-row">
                  <span className="availability-label">Availability</span>
                  <span
                    className={`availability-badge ${
                      surgery.availability?.toLowerCase() === "available"
                        ? "available"
                        : "other-availability"
                    }`}
                  >
                    {surgery.availability || "Not specified"}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="disclaimer">
            Costs and availability are estimates. Contact the hospital to
            confirm current prices, dates, and services.
          </p>
        </section>

        {/* DOCTORS */}
        <section className="content-section doctor-section" id="doctors">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEET THE SPECIALISTS</p>
              <h2>Find Doctors</h2>
            </div>
            <span className="result-count">
              {doctorLoading
                ? "Loading..."
                : `${filteredDoctors.length} results`}
            </span>
          </div>

          <div className="section-search">
            <input
              type="search"
              placeholder="Search by doctor, specialization, qualification, or hospital..."
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
            />
          </div>

          {doctorLoading && <p className="message">Loading doctors...</p>}
          {doctorError && <p className="error-message">{doctorError}</p>}

          {!doctorLoading &&
            !doctorError &&
            filteredDoctors.length === 0 && (
              <p className="message">No matching doctors found.</p>
            )}

          <div className="doctor-grid">
            {filteredDoctors.map((doctor) => (
              <article className="doctor-card" key={doctor.id}>
                <div className="doctor-card-top">
                  <div className="doctor-avatar">
                    {(doctor.doctorName || "D")
                      .replace(/^Dr\.?\s*/i, "")
                      .charAt(0)}
                  </div>
                  <span
                    className={`availability-badge ${
                      doctor.availability?.toLowerCase() === "available"
                        ? "available"
                        : "other-availability"
                    }`}
                  >
                    {doctor.availability || "Not specified"}
                  </span>
                </div>

                <h3>{doctor.doctorName || "Doctor"}</h3>
                <p className="doctor-specialization">
                  {doctor.specialization || "Specialization not provided"}
                </p>

                <div className="doctor-info">
                  <p>
                    <span>Qualification</span>
                    <strong>{doctor.qualification || "Not provided"}</strong>
                  </p>
                  <p>
                    <span>Experience</span>
                    <strong>{doctor.experience || "Not provided"}</strong>
                  </p>
                  <p>
                    <span>Hospital</span>
                    <strong>{doctor.hospital?.name || "Not assigned"}</strong>
                  </p>
                  <p>
                    <span>Contact</span>
                    <strong>{doctor.contactNumber || "Not provided"}</strong>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BOOK APPOINTMENT */}
        <section className="content-section booking-section" id="booking">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TAKE THE NEXT STEP</p>
              <h2>Book an Appointment</h2>
            </div>
          </div>

          <p className="booking-description">
            Choose an available doctor and surgery to submit an appointment
            request. New requests start with Pending status.
          </p>

          <form className="booking-form" onSubmit={handleBookingSubmit}>
            <div className="booking-field">
              <label htmlFor="patientName">Patient name *</label>
              <input
                id="patientName"
                name="patientName"
                type="text"
                placeholder="Enter your full name"
                value={booking.patientName}
                onChange={handleBookingChange}
                maxLength={100}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="patientPhone">10-digit phone number *</label>
              <input
                id="patientPhone"
                name="patientPhone"
                type="tel"
                inputMode="numeric"
                placeholder="Enter your phone number"
                value={booking.patientPhone}
                onChange={handleBookingChange}
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="doctorId">Choose doctor *</label>
              <select
                id="doctorId"
                name="doctorId"
                value={booking.doctorId}
                onChange={handleBookingChange}
                required
              >
                <option value="">Select a doctor</option>
                {doctors
                  .filter(
                    (doctor) =>
                      doctor.availability?.toLowerCase() === "available"
                  )
                  .map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.doctorName} — {doctor.specialization}
                    </option>
                  ))}
              </select>
            </div>

            <div className="booking-field">
              <label htmlFor="surgeryId">Choose surgery *</label>
              <select
                id="surgeryId"
                name="surgeryId"
                value={booking.surgeryId}
                onChange={handleBookingChange}
                required
              >
                <option value="">Select a surgery</option>
                {surgeries
                  .filter(
                    (surgery) =>
                      surgery.availability?.toLowerCase() === "available"
                  )
                  .map((surgery) => (
                    <option key={surgery.id} value={surgery.id}>
                      {surgery.surgeryName} — {formatCost(surgery.estimatedCost)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="booking-field">
              <label htmlFor="appointmentDate">Appointment date *</label>
              <input
                id="appointmentDate"
                name="appointmentDate"
                type="date"
                min={today}
                value={booking.appointmentDate}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="appointmentTime">Appointment time *</label>
              <input
                id="appointmentTime"
                name="appointmentTime"
                type="time"
                value={booking.appointmentTime}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="booking-submit-row">
              <button
                type="submit"
                className="booking-submit"
                disabled={
                  bookingLoading ||
                  doctorLoading ||
                  surgeryLoading ||
                  doctors.length === 0 ||
                  surgeries.length === 0
                }
              >
                {bookingLoading ? "Submitting..." : "Submit Appointment"}
              </button>
              <span className="required-note">* Required fields</span>
            </div>

            {bookingMessage && (
              <div
                className={`booking-message ${
                  bookingError ? "booking-failure" : "booking-success"
                }`}
                role="status"
                aria-live="polite"
              >
                {bookingMessage}
              </div>
            )}
          </form>
        </section>

        {/* MY APPOINTMENTS */}
        <section
          className="content-section my-appointments-section"
          id="my-appointments"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR BOOKING DETAILS</p>
              <h2>My Appointments</h2>
            </div>
          </div>

          <p className="booking-description">
            Enter the phone number used when booking to find matching
            appointment records.
          </p>

          <form
            className="appointment-lookup-form"
            onSubmit={handleAppointmentLookup}
          >
            <div className="booking-field">
              <label htmlFor="lookupPhone">Registered phone number</label>
              <input
                id="lookupPhone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="Enter your 10-digit phone number"
                value={lookupPhone}
                onChange={(event) => {
                  setLookupPhone(event.target.value);
                  setLookupMessage("");
                  setLookupError(false);
                  setHasSearched(false);
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="booking-submit"
              disabled={lookupLoading}
            >
              {lookupLoading ? "Searching..." : "Find Appointments"}
            </button>
          </form>

          {lookupMessage && (
            <p
              className={
                lookupError
                  ? "error-message lookup-message"
                  : "message lookup-message"
              }
              role="status"
              aria-live="polite"
            >
              {lookupMessage}
            </p>
          )}

          {hasSearched && appointments.length > 0 && (
            <div className="appointment-results">
              <div className="appointment-results-heading">
                <h3>Appointment Results</h3>
                <span>{appointments.length} found</span>
              </div>

              <div className="appointment-grid">
                {appointments.map((appointment) => (
                  <article
                    className="appointment-card"
                    key={appointment.id}
                  >
                    <div className="appointment-card-header">
                      <div>
                        <span className="appointment-id">
                          BOOKING #{appointment.id}
                        </span>
                        <h3>{appointment.patientName}</h3>
                      </div>

                      <span
                        className={`appointment-status ${statusClass(
                          appointment.status
                        )}`}
                      >
                        {appointment.status || "Pending"}
                      </span>
                    </div>

                    <div className="appointment-card-details">
                      <p>
                        <span>Phone</span>
                        <strong>{appointment.patientPhone}</strong>
                      </p>
                      <p>
                        <span>Date</span>
                        <strong>
                          {formatDate(appointment.appointmentDate)}
                        </strong>
                      </p>
                      <p>
                        <span>Time</span>
                        <strong>{appointment.appointmentTime || "Not provided"}</strong>
                      </p>
                      <p>
                        <span>Doctor</span>
                        <strong>
                          {appointment.doctor?.doctorName || "Not assigned"}
                        </strong>
                      </p>
                      <p>
                        <span>Surgery</span>
                        <strong>
                          {appointment.surgery?.surgeryName || "Not assigned"}
                        </strong>
                      </p>
                      <p>
                        <span>Hospital</span>
                        <strong>
                          {appointment.surgery?.hospitalName ||
                            appointment.surgery?.hospital?.name ||
                            appointment.doctor?.hospital?.name ||
                            "Not specified"}
                        </strong>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer>
        <strong>SurgiFind</strong>
        <p>Hospital discovery and appointment management.</p>
        <small>
          This prototype retrieves appointment records by phone number.
          Production systems should verify patient identity before showing
          private medical appointment details.
        </small>
      </footer>
    </div>
  );
}

export default App;
