import { Stack, Typography, useMediaQuery } from "@mui/material"


const Acercade = ({ id }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
  return (
<Stack      
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{ paddingBottom: "4rem", backgroundColor: "#000", borderBottom: "2px solid #C39D65", paddingTop: isMobile ? "1rem" : "2rem" }}
    >
      <Typography className="seccion3-title">Acerca de VIAJERO CR</Typography>

      <Stack direction={isMobile ? "column" : "row"} alignItems="center" justifyContent="center" spacing={isMobile ? 4 : 18}
      >
        <img src="/images/viajerocr.jpeg" alt="Viajero CR" className="acercade-image" />


        <Stack direction="column" alignItems="center" justifyContent="center" spacing={2} style={{ width: isMobile ? "80%" : "40%" }}>
            <Typography className="acercade-descripcion">ViajeroCR nace de una pasión real por descubrir el mundo y de la experiencia personal de <strong>Edgar Leiva</strong>, quien durante más de 15 años ha recorrido más de 80 países y gran cantidad de ciudades y pueblos. Cada destino ha sido una escuela, cada viaje una lección, y hoy todo ese conocimiento se transforma en asesoría cercana, honesta y estratégica para quienes confían en este proyecto.</Typography>
            <Typography className="acercade-descripcion">Aquí cada viaje se diseña como si fuera propio. No se trata solo de reservar vuelos, trenes y hoteles, sino de entender qué sueña cada viajero, qué espera sentir y cómo convertir ese deseo en una experiencia bien estructurada, segura y memorable. La diferencia está en la experiencia directa en cada destino, el acompañamiento personal, en los detalles pensados con anticipación y en la tranquilidad de saber que hay destreza real detrás de cada recomendación.</Typography>
            <Typography className="acercade-descripcion">ViajeroCR no busca simplemente cumplir con un itinerario; busca que cada cliente viaje con confianza, ilusión y respaldo en cada etapa del proceso. Porque cuando un viaje se planifica con conocimiento, dedicación y corazón, el resultado se siente distinto. Edgar en toda su experiencia ha entendido y puesto en práctica, que viajar no es solo trasladarse… es cumplir sueños con respaldo, visión y propósito.</Typography>
        </Stack>

      </Stack>
    </Stack>
  )
}

export default Acercade
