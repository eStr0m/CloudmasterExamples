import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "../../css/FormStyle.css";
import "react-calendar/dist/Calendar.css";
import { useEffect, useState } from "react";
import axios from "axios";
import CheckoutForm from "../../components/stripe/CheckoutForm.js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { HeadProvider, Title, Meta } from "react-head";
import { getPrice } from "../../components/api/getPrice.js";
import questionIcon from "../../img/QuestionIcon.png";
import checkUser from "../../components/checkUser.js";

export default function BookingPage() {
  const stripePromise = loadStripe(`${process.env.REACT_APP_SK_LIVE}`);
  const [selectDate, setSelectDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [takenTimes, setTakenTimes] = useState([]);
  const [intersection, setIntersection] = useState([]);
  const [stripeForm, setStripeForm] = useState(false);
  const [stripeSCState, setStripeSCState] = useState();
  const [stripeId, setStripeId] = useState();
  const [displayedDate, setDisplayedDate] = useState("");
  const [info, setInfo] = useState({});
  const [currentDate, setCurrentDate] = useState();
  const [isLoading, setIsLoading] = useState(false); // default state to disable the "booking" btn, while waiting for Stripe to respond.
  const [cancelledBooking, setCancelledBooking] = useState(false);
  const [formValidation, setFormValidation] = useState(false);
  const [price, setPrice] = useState("");
  const [backendStartTime, setBackendStartTime] = useState();
  const [backendEndTime, setBackendEndTime] = useState();

  // Currently sets "today" as the recommended booking date. Change code later to choose the "first available"
  useEffect(() => {
    if (selectDate === null) {
      firstAvailableDay();
    }
   
  });



  useEffect(() => {
    getPrice().then((result) => setPrice(result));
    getStartEndTime();
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (selectDate) {
      getTimeOfBooking(selectDate);
      // Format the selected date as per your requirement
      const formattedDate = `${selectDate.getDate()}.${
        selectDate.getMonth() + 1
      }.${selectDate.getFullYear()}`;

      setDisplayedDate(formattedDate);
    }

    // Update the field or trigger the necessary action
    // whenever `selectedData` changes.
  }, [selectDate]);

  const schema = yup.object().shape({
    fname: yup.string().required("Vennligst skriv inn fornavnet ditt"),
    lname: yup.string().required("Vennligst skriv inn etternavnet ditt"),
    email: yup.string().required("Vennligst skriv inn eposten din"),
    telephone: yup
      .string()
      .max(8, "Telefonnummer kan kun bestå av 8 siffer")
      .min(8, "Telefonnummer kan kun bestå av 8 siffer")
      .required(
        "Vennligst skriv inn telefonnummeret ditt. Det må være 8 siffer"
      ),
    dob2: yup.string().required("Vennligst skriv inn fødselsnummeret ditt"),
    adr: yup.string().required("Vennligst skriv inn adressen din"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const options = {
    // passing the client secret obtained in step 3
    clientSecret: stripeSCState,
    // Fully customizable with appearance API.
    appearance: {},
  };



  async function getTimeOfBooking(selectedDate) {
    let selectedDate2 = new Date(selectedDate);
    selectedDate2 = `${selectedDate.getFullYear()}-${
      selectedDate.getMonth() + 1
    }-${selectedDate.getDate()}`;
    await axios
      .post(`${process.env.REACT_APP_APP_URL}` + "getTimeOfBooking", {
        selectedDate: selectedDate2,
      })
      .then((result) => {
        let data = result.data;
        //create a local array that is pushed to setstate
        let localArray = [];
        let isFinished = false;
        if (!isFinished) {
          data.forEach((element) => {
            localArray.push(element.time.slice(0, 5));
          });
          isFinished = true;
        }

        if (isFinished) {
          setTakenTimes(localArray);
        }
      });
  }

  function firstAvailableDay() {
    let selectedDate = new Date();

    document.getElementById("valgtDato").value = `${selectedDate.getDate()}.${
      selectedDate.getMonth() + 1
    }.${selectedDate.getFullYear()}`;
    setSelectDate(selectedDate);
  }

  async function onSubmit(data) {
    if (selectedTime == undefined || selectedTime == "") {
      document.getElementById("errorMessage").innerHTML = "Velg tidspunkt";
    } else {

    if (data) {
      let chosenDate = document.getElementById("valgtDato").value;
      let chosenDate2 = new Date(selectDate);
      chosenDate2 = `${chosenDate2.getFullYear()}-${
        chosenDate2.getMonth() + 1
      }-${chosenDate2.getDate()}`;

      setInfo({
        fname: data.fname,
        lname: data.lname,
        email: data.email,
        telephone: data.telephone,
        dob: data.dob2,
        address: data.adr,
        chosenDate: chosenDate2,
        selectDate: selectDate,
        selectTime: selectedTime,
      });

      // disables booking btn...
      setIsLoading(true);
      await axios
        .post(`${process.env.REACT_APP_APP_URL}` + "api/post/stripePayment", {
          email: data.email,
        })
        .then((result) => {
          setStripeSCState(result.data.stripeCS);
          setStripeId(result.data.stripeId);

          // enables booking btn after promise is resolved.
          setIsLoading(false);
        });

      if (stripePromise) {
        setStripeForm(true);
        window.scrollTo(0, 0);
      }
    }
  }

  }

  async function handleClose(e) {
    if (e.target.id === "closePayment" || e.key === "Escape") {
      document.querySelector(".checkoutModal").style.display = "none";
      axios
        .post(`${process.env.REACT_APP_APP_URL}` + "api/post/cancelPayment", {
          cancelled: true,
          stripeId: stripeId,
        })
        .then((result) => {
          if (result.status == 200) {
            setCancelledBooking(true);
            setStripeForm(false);
            setIsLoading(false);
          }
        });
    }
  }

  async function handleKeyPress(e) {

    if (e.key === "Escape") {
      handleClose(e);
      // Handle the "Escape" keypress event here
    }
  }

  function logChangeDate(date) {
    let selectedDate = new Date(date);

    document.getElementById("showCalendar").style.visibility = "hidden";
    document.getElementById("valgtDato").value = `${selectedDate.getDate()}.${
      selectedDate.getMonth() + 1
    }.${selectedDate.getFullYear()}`;

    setSelectDate(selectedDate);
  }

  async function chooseDate(f) {
    if (f.type === "click") {
      //showing the calendar if we click on the calendar
      document.getElementById("showCalendar").style.visibility = "visible";

    }
  }

  async function showMessage() {
    const endTime = 21; // setter slutten på siste time til 21.00.
    let currentDate = new Date(Date.now());

    let hours = currentDate.getHours(); //why - 8?
    let minutes = currentDate.getMinutes();

    if (selectDate) {
      let sameDate = selectDate.getDate() === currentDate.getDate();

      // if(selectedTime === "") {
      if (sameDate) {
        if (hours >= endTime) {
          setSelectedTime("Velg en annen dato")
          // document.getElementById("chosenTime").innerHTML = "Velg en annen dato";
        } else if (hours + 1 <= endTime && minutes >= 30) {
          setSelectedTime(hours + 1);
        } else {
          setSelectedTime(`${hours + 1}:00`);
        }
      }
      if (!sameDate) {
        // document.getElementById("chosenTime").innerHTML = "Velg et tidspunkt";
        setSelectedTime(hours);
      }
    }
  }

  async function getStartEndTime() {
    axios.post(`${process.env.REACT_APP_APP_URL}getStartEndTime`).then((result) => {
      setBackendStartTime(result.data[0].startTime)
      setBackendEndTime(result.data[0].endTime)
    })
  }

  const generateTimes = () => {
    const times = [];
    // let intersection;
    const startTime = new Date();
    const endTime = new Date();
    // startTime.setHours(17, 0, 0); // Set the start time to 9:00.
    // endTime.setHours(21, 0, 0); // Set the end time to 15:30.


    if(backendStartTime) {
      startTime.setHours(backendStartTime.slice(0,2), 0, 0); // Set the start time to 9:00.
      endTime.setHours(backendEndTime.slice(0,2), 0, 0); // Set the end time to 15:30.
    }

    // Generate times every 30 minutes until the end time.
    while (startTime < endTime) {
      times.push(
        startTime.toLocaleTimeString("nb-NO", {
          hour: "2-digit",
          minute: "2-digit",
          // second: "2-digit",
        })
      );

      startTime.setMinutes(startTime.getMinutes() + 30); // Increment by 30 minutes.
    }
    let intersection = times.filter((x) => !takenTimes.includes(x));
    
    
    
    return intersection;
  };

  const times = generateTimes();

  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  async function handleClick() {
    let id = document.getElementById("idMessage").style.display;
    if (id === "none") {
      document.getElementById("idMessage").style.display = "block";
    } else {
      document.getElementById("idMessage").style.display = "none";
    }
  }


  async function handleClick2() {
    let id = document.getElementById("idMessage2").style.display;
    if (id === "none") {
      document.getElementById("idMessage2").style.display = "block";
    } else {
      document.getElementById("idMessage2").style.display = "none";
    }
  }

  return (
    <HeadProvider>
      <Title>Prosjekt1 - Book nå</Title>
      <Meta
        name="description"
        content="Ønsker du å kontakte Prosjekt1? Ta kontakt med oss idag"
      />

      <div>
        <div class="bookingPage">
          <form class="bookingForm formCont" onSubmit={handleSubmit(onSubmit)}>
            <div class="formSide left">
              <label class="formLabel" for="fname">
                Fornavn
              </label>
              <input
                {...register("fname")}
                class={`formInput ${errors.fname && "formError"}`}
                type="text"
                id="fname"
                name="fname"
                placeholder={errors.fname ? errors.fname.message : "Ola"}
              ></input>

              <label class="formLabel" for="lname">
                Etternavn
              </label>
              <input
                {...register("lname")}
                class={`formInput ${errors.lname && "formError"}`}
                type="text"
                id="lname"
                name="lname"
                placeholder={errors.lname ? errors.lname.message : "Normann"}
              ></input>
              {errors.lname && <span>{errors.lname.message}</span>}

              <label class="formLabel" for="email">
                Epost
              </label>
              <input
                {...register("email")}
                class={`formInput ${errors.email && "formError"}`}
                type="email"
                id="email"
                name="email"
                placeholder={
                  errors.email ? errors.email.message : "ola@normann.no"
                }
              ></input>

              <label class="formLabel" for="telephone">
                Telefon
                <span onClick={handleClick2} class="infoButton">
                  <img src={questionIcon}></img>
                  <div id="idMessage2">
                    <p>
                      Du kan kun legge til et norsk nummer med 8 siffer, og trenger derfor ikke legge til +47
                    </p>
                  </div>
                </span>

              </label>
              
              <input
                {...register("telephone")}
                class={`formInput ${errors.telephone && "formError"}`}
                type="text"
                id="telephone"
                name="telephone"
                placeholder={
                  errors.telephone ? errors.telephone.message : "55 55 66 66"
                }
              ></input>

              <label class="formLabel" for="dob2">
                Fødselsnummer
                <span onClick={handleClick} class="infoButton">
                  <img src={questionIcon}></img>
                  <div id="idMessage">
                    <p>
                      Som andre tannleger fører vi journal på alle pasienter. Du
                      kan være trygg på at vi behandler all informasjon
                      konfidensielt.
                    </p>
                  </div>
                </span>
              </label>
              <input
                {...register("dob2")}
                class={`formInput ${errors.dob2 && "formError"}`}
                type="text"
                id="dob2"
                name="dob2"
                placeholder={errors.dob2 ? errors.dob2.message : "010101 12345"}
              ></input>

              <label class="formLabel" for="adr">
                Adresse
              </label>
              <input
                {...register("adr")}
                class={`formInput ${errors.adr && "formError"}`}
                type="text"
                id="adr"
                name="adr"
                placeholder={
                  errors.adr ? errors.adr.message : "Prins Haralds veg 11, 2819 Gjøvik"
                }
              ></input>

              {/* <div id="idMessage"><p>Som tannleger ellers fører vi journal på alle våre pasienter. Du kan være trygg på at ingen informasjon du gir oss kommer på avveie.</p></div> */}
            </div>

            <div class="formSide right">
              <div class="formDateCont">
                <label class="formLabel" for="valgtDato">
                  Valgt dato
                </label>

                <input
                  class="formInput"
                  type="text"
                  id="valgtDato"
                  name="valgtDato"
                  placeholder="Mandag 1. Januar"
                  onClick={(f) => chooseDate(f)}
                ></input>
              </div>

              <div id="showCalendar">
                <Calendar
                  locale="no-NO"
                  onChange={logChangeDate}
                  minDate={new Date()}
                />
              </div>

              <p class="formLabel" id="chosenTime">
                {" "}
                {selectedTime
                  ? `Du har valgt ${selectedTime}`
                  : `Velg klokkeslett`}{" "}
              </p>
              <div class="formTimeCont">
                {times.map((time, index) => (
                  <div
                    className={`number ${
                      selectedTime === time ? "selectedTime" : ""
                    }`}
                    key={index}
                    onClick={() => handleTimeSelection(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>

              <button class="formBtn desktopBtn" disabled={isLoading}>
                {isLoading ? "Venter på betaling" : `Bestill time ${price},-`}
              </button>
            </div>

            <button class="formBtn mobileBtn" disabled={isLoading}>
              {isLoading ? "Vennligst vent" : `Bestill time ${price},-`}
            </button>
          </form>

          <div
            id="cancelledBooking"
            style={{ display: `${cancelledBooking ? "block" : "none"}` }}
          >
            Booking avbrutt
          </div>

        </div>
          <div id="errorMessage"></div>

        {stripeForm && (
          <div
            class="checkoutModal"
            onKeyDown={(e) => {
              handleKeyPress(e);
            }}
            tabIndex={0}
          >
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm info={info} price={price} />
            </Elements>
            <span
              id="closePayment"
              onClick={handleClose}
              onKeyDown={(e) => {
                handleKeyPress(e);
              }}
              tabIndex={0}
            >
              &times;
            </span>
            <p class="feedbackBooking"></p>
          </div>
        )}
      </div>
    </HeadProvider>
  );
}

