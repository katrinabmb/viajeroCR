import { useCallback, useEffect, useRef, useState } from "react";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Avatar, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import PropTypes from "prop-types";

const CardTestimonio = ({ destino, name, testimonio }) => {
  return (
    <Stack
      direction="column"
      alignItems="flex-start"
      justifyContent="space-around"
      spacing={2}
      className="card-testimonio"
    >
      <Avatar sx={{ bgcolor: "#C39D65" }}>{name.charAt(0)}</Avatar>

      <Typography className="card-testimonio-destino">Destino: {destino}</Typography>
      <Typography className="card-testimonio-testimonio">
        {testimonio}
      </Typography>
      <Typography className="card-testimonio-name">Autor: {name}</Typography>
    </Stack>
  );
};

CardTestimonio.propTypes = {
  destino: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  testimonio: PropTypes.string.isRequired,
};

const Testimonios = ({ id }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemRefs = useRef([]);
  const carouselRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 600px)");

  const testimonios = [
    {
      id: 1,
      destino: "Argentina",
      name: "Zacarías",
      testimonio:
        "ViajeroCR me ayudó a regresar a Argentina con mi perro en tiempo récord. Se encargó de toda la logística y aduanas, todo esto en poco tiempo. Profesionalismo total. Lo recomiendo al 100%.",
    },
    {
      id: 2,
      destino: "Europa",
      name: "Andrés C",
      testimonio:
        "Gracias a ViajeroCr disfrutamos un viaje impecable por Europa. Todo estuvo organizado al detalle, con seguimiento diario y apoyo constante. Súper recomendados. ¡Volveremos a viajar con ustedes!",
    },
    {
      id: 3,
      destino: "Japón",
      name: "Máximo Salas",
      testimonio:
        "El itinerario fue perfecto para nosotros, todo súper bien organizado. La atención fue excelente, incluso respondiendo mensajes en la madrugada. Nos apoyaron en todo momento. ¡De verdad, una experiencia increíble!",
    },
    {
      id: 4,
      destino: "Europa",
      name: "Glori",
      testimonio:
        "El viaje superó nuestras expectativas. Cada detalle y el seguimiento durante el viaje marcaron la diferencia. Los disfrutamos muchísimo y estamos profundamente agradecidos.",
    },
    {
      id: 5,
      destino: "Europa",
      name: "Alonso",
      testimonio:
        "Excelente logística y organización. Todo salió de lujo. Sin duda volveré a contactarlos para futuros viajes.",
    },
    {
      id: 6,
      destino: "Europa",
      name: "Melissa",
      testimonio:
        "Súper agradecidos. Sin tu guía el viaje no habría sido ni remotamente igual. La organización fue impecable, una experiencia inolvidable. ¡Te dámos un 100 y más",
    },
    {
      id: 7,
      destino: "Europa",
      name: "Adelina Espinoza",
      testimonio:
        "Gracias a tus recomendaciones, en todos los destinos, nuestro viaje ha sido un sueño hecho realidad. ¡Increíblemente agradecidos!",
    },
    {
      id: 8,
      destino: "Europa",
      name: "Dayana Trejos",
      testimonio:
        "Gracias a tu apoyo y asesoría, conocimos todo lo que queríamos a nuestro ritmo, disfrutando tranquilos y relajados del viaje.",
    },
    {
      id: 9,
      destino: "Francia",
      name: "Melisa Oviedo",
      testimonio:
        "Gracias a tu guía, cumplí mi sueño de visitar pueblos mágicos como en  “La Bella y La Bestia”. ¡La experiencia superó mis expectativas! Eternamente agradecida.",
    },
    {
      id: 10,
      destino: "Suiza",
      name: "Adriana Ramírez",
      testimonio:
        "Gracias por diseñar nuestra aventura y estar siempre disponible. El viaje estuvo de ensueño, súper recomendado al 100%.",
    },
    {
      id: 11,
      destino: "Islandia",
      name: "Rosa Segura",
      testimonio:
        "Gracias por tu excelente trabajo. Todo estuvo perfecto y esperamos planear otro viaje contigo pronto.",
    },
    {
      id: 12,
      destino: "Argentina",
      name: "Yency Garita",
      testimonio:
        "Todo fue espectacular y siempre contamos con apoyo. Mil gracias por estar pendiente. ¡Esperamos repetir muchos viajes más!",
    },
    {
      id: 13,
      destino: "Argentina",
      name: "Ileana Sandí",
      testimonio:
        "Te volviste a lucir. Gracias por el excelente viaje. Siempre te recomendaremos.",
    },
    {
      id: 14,
      destino: "Italia",
      name: "Pamela Ramírez",
      testimonio:
        "El viaje fue mágico y perfectamente organizado por ViajeroCR. Todo estuvo súper bien coordinado. ¡Recomendado al 100%! Gracias.",
    },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollToIndex = useCallback((index) => {
    const carousel = carouselRef.current;
    const node = itemRefs.current[index];
    if (!carousel || !node) return;

    // Evita `scrollIntoView` (en mobile puede provocar scroll del window / indicadores).
    const left = node.offsetLeft;
    carousel.scrollTo({
      left,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [prefersReducedMotion]);

  const goToIndex = useCallback(
    (index) => {
      setActiveIndex(index);
      scrollToIndex(index);
    },
    [scrollToIndex]
  );

  const handleNext = useCallback(() => {
    const nextIndex = (activeIndex + 1) % testimonios.length;
    goToIndex(nextIndex);
  }, [activeIndex, goToIndex, testimonios.length]);

  useEffect(() => {
    if (isPaused) return;
    if (prefersReducedMotion) return;
    if (testimonios.length < 2) return;

    const intervalMs = 4500;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % testimonios.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, scrollToIndex, testimonios.length]);

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{
        paddingBottom: "4rem",
        backgroundColor: "#000",
        paddingTop: isMobile ? "1rem" : "2rem",
      }}
    >
      <Typography className="seccion3-title">Testimonios</Typography>

      <div
        className="testimonios-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div
          className="testimonios-carousel"
          aria-label="Carrusel de testimonios"
          ref={carouselRef}
        >
          <div className="testimonios-track">
            {testimonios.map((testimonio, idx) => (
              <div
                key={testimonio.id}
                className="testimonios-item"
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
              >
                <CardTestimonio
                  destino={testimonio.destino}
                  name={testimonio.name}
                  testimonio={testimonio.testimonio}
                />
              </div>
            ))}
          </div>
        </div>

        <IconButton
          className="testimonios-nextBtn"
          onClick={handleNext}
          aria-label="Siguiente testimonio"
        >
          <ArrowForwardIosRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <Stack direction={isMobile ? "column" : "row"} alignItems="center" justifyContent="center" spacing={2} style={{width: "100%"}}>
        <img src="/images/testimonio1.PNG" alt="Testimonio 1" className="testimonio-image"/>
        <img src="/images/testimonio2.PNG" alt="Testimonio 2" className="testimonio-image"/>
      </Stack>
    </Stack>
  );
};

Testimonios.propTypes = {
  id: PropTypes.string,
};

export default Testimonios;
