import { Backdrop, Button, CircularProgress, Stack, Typography, useMediaQuery } from "@mui/material"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CountryCode from "./CountryCode";
import "./form.css";
// import { sendFormApi } from "../../store/thunks";

const SERVICES_OPTIONS = [
  "salidas grupales",
  "circuitos regulares",
  "viajes personalizados",
  "viajes familiares",
  "boletos",
  "hoteles",
  "traslados",
  "tours",
  "seguros",
  "visas",
];

const CONTACT_API_URL = "https://send-form.viajerocr.com/send-form.php";

const showFormAlert = ({ icon, title, text }) =>
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: "Entendido",
    customClass: {
      popup: "viajero-swal-popup",
      title: "viajero-swal-title",
      htmlContainer: "viajero-swal-text",
      confirmButton: "viajero-swal-confirm",
    },
    buttonsStyling: false,
  });

// eslint-disable-next-line react/prop-types
const Form = ({ onClose }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const isTablet = useMediaQuery('(min-width: 601px) and (max-width: 1024px)');
    const computer = useMediaQuery('(min-width: 1025px) and (max-width: 1599px)');
    const [openSending, setOpenSending] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(true);
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      approximateTravelDates: "",
      daysQuantity: "",
      peopleQuantity: "",
      serviceInterest: "",
      inquiry: "",
    });
    const navigate = useNavigate();
    const handleClose = () => {
      if (typeof onClose === "function") {
        onClose();
        return;
      }
      navigate(-1);
    };
    const handleInputChange = (eventOrValue, fieldName = null) => {
      // Verifica si se recibió el nombre del campo, lo que indica un valor directo, no un evento  
      if (fieldName) {
        setFormData((prevData) => ({
          ...prevData,
          [fieldName]: eventOrValue  // Usando directamente el valor
        }));
      } else if (typeof eventOrValue === 'string') {
        // Asumimos que es el teléfono si es un string directo sin fieldName
        setFormData((prevData) => ({
          ...prevData,
          phone: eventOrValue
        }));
      } else {
        // Aquí se maneja como un evento HTML estándar
        const { name, value } = eventOrValue.target;
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
    };

    const resetForm = () => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        approximateTravelDates: "",
        daysQuantity: "",
        peopleQuantity: "",
        serviceInterest: "",
        inquiry: "",
      });
    };

    const validateFormData = () => {
      const requiredFields = [
        "name",
        "email",
        "phone",
        "peopleQuantity",
        "serviceInterest",
        "inquiry",
      ];

      const hasMissingField = requiredFields.some((field) => !String(formData[field] ?? "").trim());
      if (hasMissingField) {
        return "Todos los campos son obligatorios.";
      }

      const peopleQuantity = Number(formData.peopleQuantity);
      if (!Number.isInteger(peopleQuantity) || peopleQuantity <= 0) {
        return "La cantidad de personas debe ser mayor que 0.";
      }

      return null;
    };

    const handleSend = async () => {
      const validationError = validateFormData();
      if (validationError) {
        setOpenSending(false);
        setIsFormVisible(false);
        await showFormAlert({
          icon: "warning",
          title: "Revisemos tu solicitud",
          text: validationError,
        });
        setIsFormVisible(true);
        return;
      }

      setOpenSending(true);
      try {
        const payload = {
          ...formData,
          daysQuantity: String(formData.daysQuantity ?? "").trim() || "0",
          approximateTravelDates: String(formData.approximateTravelDates ?? "").trim(),
        };

        const response = await fetch(CONTACT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const rawResponse = await response.text();
        let responseData = null;
        if (rawResponse) {
          try {
            responseData = JSON.parse(rawResponse);
          } catch {
            responseData = null;
          }
        }
        if (!response.ok || !responseData?.success) {
          throw new Error(responseData?.message || `No se pudo enviar la solicitud. HTTP ${response.status}`);
        }

        setOpenSending(false);
        setIsFormVisible(false);
        await showFormAlert({
          icon: "success",
          title: "Hemos recibido tu solicitud",
          text: "Gracias por escribirnos. Un agente de Viajero CR web te contactará muy pronto con toda la información.",
        });
        resetForm();
        handleClose();
      } catch (error) {
        setOpenSending(false);
        setIsFormVisible(false);
        await showFormAlert({
          icon: "error",
          title: "No pudimos completar el envío",
          text: error.message || "Ocurrió un error al enviar la solicitud.",
        });
        setIsFormVisible(true);
      } finally {
        setOpenSending(false);
      }
    };


  

  return (
   <>
   {/* Contenedor principal del formulario */}
   <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1000000 })}
        open={openSending}
        
      >
        <CircularProgress color="inherit" />
      </Backdrop>
   <Stack
            justifyContent="center"
            alignItems="center"
            spacing={isMobile || isTablet ? 2 : 1}
            style={{
              position:"fixed",
              display: isFormVisible ? "flex" : "none",
              backgroundColor: "#505050",
              borderRadius: "20px",
              width: isMobile || isTablet ? "90%" : (computer ? "45%" : "30%"),
              paddingTop: isMobile || isTablet ? "6%" : "2%",
              paddingBottom: isMobile || isTablet ? "5%" : "2%",
              height: isMobile || isTablet ? "auto" : "auto",
              top: isMobile || isTablet ? "5%" : "50%",
              left: isMobile || isTablet ? "5%" : "50%",
              transform: isMobile || isTablet ? "translate(0%, 0%)" : "translate(-50%, -50%)",
              zIndex: 10000,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(2px)"
            }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={handleClose}
              style={{
                position: "absolute",
                top: isMobile || isTablet ? "10px" : "12px",
                right: isMobile || isTablet ? "10px" : "12px",
                width: isMobile || isTablet ? "36px" : "40px",
                height: isMobile || isTablet ? "36px" : "40px",
                border: "none",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#fff",
                cursor: "pointer",
                fontSize: isMobile || isTablet ? "22px" : "24px",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
            >
              ×
            </button>
            {/* <img
              src={isMobile || isTablet ? "/images/logoNew.svg" : "/images/logoNew.svg"}
              alt="logo"
              style={{ width: isMobile || isTablet ? "18%" : "150px", height: "auto" }}
            /> */}
            {/* Contenedor del variante de formulario */}
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={isMobile ? 1 : 2}
              style={{ width: "100%" }}
              
            >
              <Stack spacing={isMobile ? 2 : 2}>
              <Stack spacing={isMobile ? 0 : 1}>
                <Stack direction="column" spacing={isMobile ? -0.5 : 0.5} alignItems="center" justifyContent="center">
                <Typography className="title-form" component="h1">
                    
                   Viajes Personalizados
                    </Typography>
                    <Typography className="title-form-cursive" component="h1">
                    
                    Experiencias Únicas
                    </Typography>
                </Stack>
                
                <Typography className="subtitle-form" component="h1">
                Reservá tus servicios aquí
                    </Typography>
              </Stack>
           
              <Stack>
                <Typography className="header-form" component="h3">
                Llená el formulario para recibir más información
                </Typography>
              </Stack>

              </Stack>
              {/* Formulario */}
              <Stack spacing={2} style={{ width: "90%" }}>
                {/* input Nombre */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre Completo"
                    className="contactoInput"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
             
                  <svg
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="15"
                    viewBox="0 0 13 15"
                    fill="none"
                  >
                    <ellipse
                      cx="6.27135"
                      cy="4.67017"
                      rx="3.89049"
                      ry="3.89527"
                      fill="#3E3934"
                    />
                    <path
                      d="M12.7546 14.6249C12.7546 14.6249 10.0451 14.6249 6.70275 14.6249C3.36039 14.6249 0.650879 14.6249 0.650879 14.6249C0.650879 10.8003 3.36039 7.69995 6.70275 7.69995C10.0451 7.69995 12.7546 10.8003 12.7546 14.6249Z"
                      fill="#3E3934"
                    />
                  </svg>
                </div>
                {/* input Email */}
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo Electrónico"
                    className="contactoInput"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
             
                  <svg
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_621_1420)">
                      <path
                        d="M7.83592 16.2581C6.67013 16.2581 5.59923 16.0596 4.65033 15.6768C3.70143 15.2798 2.87453 14.7411 2.18319 14.0322C1.49185 13.3233 0.963176 12.501 0.583616 11.5512C0.204056 10.6013 0.027832 9.5663 0.027832 8.4321C0.027832 7.2979 0.217612 6.2913 0.583616 5.35558C0.963176 4.41986 1.49185 3.59757 2.18319 2.88869C2.87453 2.17982 3.70143 1.64107 4.67744 1.25828C5.6399 0.875487 6.7108 0.677002 7.9037 0.677002C9.0966 0.677002 10.0862 0.86131 11.0215 1.22992C11.9704 1.59854 12.7838 2.12311 13.4615 2.78945C14.1393 3.45579 14.668 4.24973 15.034 5.14292C15.4 6.0361 15.5898 7.02853 15.5898 8.09184C15.5898 9.09844 15.4542 9.96327 15.1696 10.6721C14.8849 11.381 14.5053 11.9339 14.0038 12.3026C13.5022 12.6712 12.9193 12.8697 12.2415 12.8697C11.5095 12.8697 10.9131 12.6428 10.4793 12.1891C10.0455 11.7355 9.82861 11.0691 9.82861 10.2043V9.42453L9.88284 8.50299L9.73372 6.0361V4.40569H11.9433V9.92074C11.9433 10.3319 12.0246 10.6154 12.1738 10.7714C12.3229 10.9273 12.5126 11.0124 12.7295 11.0124C12.9735 11.0124 13.1904 10.9132 13.3667 10.7005C13.5429 10.502 13.6784 10.1759 13.7869 9.75061C13.8818 9.32528 13.936 8.78654 13.936 8.12019C13.936 7.25537 13.7869 6.4756 13.5022 5.75255C13.2175 5.0295 12.7973 4.41986 12.2686 3.8953C11.7264 3.37073 11.0893 2.97376 10.3437 2.69021C9.59817 2.40666 8.78482 2.27906 7.87659 2.27906C6.96836 2.27906 6.15501 2.43501 5.40945 2.73274C4.66389 3.04465 4.02677 3.46997 3.48454 4.02289C2.95587 4.57582 2.54919 5.22798 2.25097 5.96521C1.9663 6.71662 1.81719 7.52474 1.81719 8.41792C1.81719 9.31111 1.95274 10.1618 2.23741 10.9132C2.52208 11.6646 2.92875 12.3167 3.44387 12.8697C3.97254 13.4226 4.59611 13.8479 5.34167 14.1598C6.08724 14.4717 6.90058 14.6135 7.79526 14.6135C8.31037 14.6135 8.8526 14.5568 9.40839 14.4292C9.96417 14.3016 10.4928 14.1173 11.008 13.8621L11.5231 15.4216C11.0215 15.6768 10.4386 15.8895 9.77439 16.0312C9.11016 16.173 8.44593 16.2439 7.79526 16.2439L7.83592 16.2581ZM7.25303 12.8697C6.56169 12.8697 5.92457 12.6854 5.35523 12.3309C4.78589 11.9765 4.33855 11.4661 3.99966 10.8139C3.66076 10.1618 3.49809 9.41035 3.49809 8.5597C3.49809 7.70905 3.66076 6.95764 3.99966 6.31965C4.32499 5.66749 4.78589 5.17127 5.35523 4.81683C5.92457 4.4624 6.56169 4.27809 7.26658 4.27809C7.97148 4.27809 8.59504 4.44822 9.11016 4.78848C9.62528 5.12874 10.0048 5.61078 10.276 6.24876C10.5471 6.88675 10.6826 7.65234 10.6826 8.5597C10.6826 9.46706 10.5471 10.2326 10.2895 10.8706C10.0319 11.5228 9.65239 12.0048 9.13727 12.3451C8.63571 12.6854 8.01215 12.8555 7.25303 12.8555V12.8697ZM7.75459 10.9132C8.1477 10.9132 8.50015 10.8139 8.79838 10.6296C9.0966 10.4453 9.35416 10.1759 9.51683 9.8215C9.69306 9.46706 9.77439 9.05591 9.77439 8.5597C9.77439 8.06348 9.69306 7.63816 9.51683 7.2979C9.34061 6.95764 9.0966 6.70244 8.79838 6.51814C8.50015 6.33383 8.13415 6.24876 7.75459 6.24876C7.37503 6.24876 7.02258 6.33383 6.7108 6.51814C6.39902 6.70244 6.16857 6.95764 5.99235 7.31208C5.81612 7.66651 5.73479 8.07766 5.73479 8.5597C5.73479 9.04173 5.81612 9.46706 5.99235 9.80732C6.16857 10.1476 6.39902 10.417 6.7108 10.6154C7.02258 10.8139 7.36147 10.899 7.75459 10.899V10.9132Z"
                        fill="#3E3934"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_621_1420">
                        <rect
                          width="15.562"
                          height="15.5811"
                          fill="white"
                          transform="translate(0.0280762 0.677246)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                {/* input Teléfono */}
                <div style={{ position: "relative" }}>
                  <CountryCode
                  value={formData.phone}
                  onChange={(phone) => handleInputChange(phone, "phone")}
                  />
             
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="14"
                    viewBox="0 0 13 14"
                    fill="none"
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M12.491 11.4933L12.4296 11.9804C12.3843 12.3394 12.195 12.6541 11.8949 12.8768C9.72224 14.4652 6.66536 12.712 4.73034 11.2307C3.34238 10.1569 2.17745 8.8248 1.37795 7.29131C-0.546693 3.57111 1.12685 1.84163 2.06252 1.21728C2.34601 1.01861 2.69529 0.945452 3.04339 0.989362L3.41828 1.03665C3.90027 1.09745 4.29152 1.44635 4.41059 1.90419L4.9097 3.98588C4.95239 4.18662 4.89974 4.38836 4.74645 4.52532L4.0684 5.15611C3.79183 5.40775 3.69137 5.77278 3.78322 6.12299C4.2879 7.94489 6.27647 9.43302 7.31981 10.1116C7.69722 10.3546 8.20231 10.3402 8.56083 10.0858L9.29611 9.54041C9.47618 9.40684 9.71026 9.38427 9.9164 9.47539L11.8337 10.3424C12.2979 10.5442 12.5642 11.0206 12.5044 11.495L12.491 11.4933Z"
                      fill="black"
                    />
                  </svg>
                </div>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    name="approximateTravelDates"
                    className="contactoInput"
                    value={formData.approximateTravelDates}
                    onChange={handleInputChange}
                    placeholder="Fechas aproximadas (ej: 1 semana, diciembre, referencia)"
                  />
                </div>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} style={{ width: "100%"}}>
 {/* input Cantidad de personas */}
 <div style={{ position: "relative", width: "50%" }}>
                  <input
                    type="number"
                    name="peopleQuantity"
                    className="contactoDate"
                    value={formData.peopleQuantity}
                    onChange={handleInputChange}
                    placeholder="Cantidad de personas"
                    required
                  />
                </div>
                {/* input Fecha regreso */}
                <div style={{ position: "relative", width: "50%" }}>
                  <input
                    type="text"
                    name="daysQuantity"
                    className="contactoDate"
                    value={formData.daysQuantity}
                    onChange={handleInputChange}
                    placeholder="Cantidad de días (opcional)"
                  />
                </div>
                </Stack>
               {/* select Servicios de Interes */}
                <div style={{ position: "relative" }}>
                  <select
                    name="serviceInterest"
                    className="contactoSelect"
                    value={formData.serviceInterest}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Servicios de interés
                    </option>
                    {SERVICES_OPTIONS.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
               

                {/* input Comentarios */}
                <div style={{ position: "relative" }}>
                  <textarea
                    name="inquiry"
                    placeholder="Destinos / Detalles"
                    className="textareaInput"
                    value={formData.inquiry}
                    onChange={handleInputChange}
                    required
                  />
            
                  <svg
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "20%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="13"
                    viewBox="0 0 24 13"
                    fill="none"
                  >
                    <path
                      d="M1.84448 1.8374H22.2344M1.84448 6.58002H16.4721M1.84448 11.3226H11.5962"
                      stroke="#3E3934"
                      strokeWidth="2.63488"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <Stack alignItems="center" justifyContent="center" spacing={2}>
                  <Button className="button-form" onClick={handleSend} disabled={openSending}>
                    Enviar
                    </Button>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="7"
                      height="9"
                      viewBox="0 0 7 9"
                      fill="none"
                    >

                      <rect
                        x="0.46167"
                        y="3.82581"
                        width="6.20564"
                        height="4.74927"
                        rx="0.878292"
                        fill="white"
                      />
                      <path
                        d="M5.28098 3.35144C5.28098 4.41984 4.48063 5.22608 3.56469 5.22608C2.64874 5.22608 1.84839 4.41984 1.84839 3.35144C1.84839 2.28305 2.64874 1.47681 3.56469 1.47681C4.48063 1.47681 5.28098 2.28305 5.28098 3.35144Z"
                        stroke="white"
                      />
                    </svg>
                    <Typography className="bottom-form">
                      Su información es 100% confidencial
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              {/* Formulario */}
            </Stack>
            {/* Contenedor del variante de formulario */}
          </Stack>
   </>
  )
}

export default Form
















