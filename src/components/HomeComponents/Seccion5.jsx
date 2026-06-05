import { Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { fetchSeccion5Data } from '../../store/seccion5Slice'

const CardSalidaGrupal = ({ title, description, fechas, precio, image, itinerario }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  return (
    <Stack direction="column" alignItems="center" justifyContent="space-between" spacing={3} className="card-salida-grupal">
      <img src={image} alt={title} className="card-salida-grupal-image" />
      <Stack direction="column" alignItems="center" justifyContent="flex-start" spacing={isMobile ? 2 : 3} className="card-salida-grupal-content">
        <Typography className="card-salida-grupal-title">{title}</Typography>
        <Typography className="card-salida-grupal-description">{description}</Typography>
        <Typography className="card-salida-grupal-fechas">{fechas}</Typography>
        <Typography className="card-salida-grupal-precio">{precio}</Typography>
      </Stack>
      <Stack alignItems="center" justifyContent="center" className="card-salida-grupal-actions">
        <a href={itinerario} className="card-salida-grupal-button" download>
          Descargar itinerario
        </a>
      </Stack>
    </Stack>
  )
}

CardSalidaGrupal.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  fechas: PropTypes.string.isRequired,
  precio: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  itinerario: PropTypes.string.isRequired,
}

const Seccion5 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const title = useSelector((state) => state.seccion5.title)
  const salidasGrupales = useSelector((state) => state.seccion5.salidas)

  useEffect(() => {
    dispatch(fetchSeccion5Data())
  }, [dispatch])

  if (!Array.isArray(salidasGrupales) || salidasGrupales.length === 0) {
    return null
  }

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{ paddingBottom: '4rem', backgroundColor: '#000', borderBottom: '2px solid #C39D65' }}
    >
      <Typography className="seccion3-title">{title}</Typography>

      <Stack direction={isMobile ? 'column' : 'row'} spacing={4} alignItems="center" justifyContent="center" style={{ width: '80%' }}>
        {salidasGrupales.map((salida) => (
          <CardSalidaGrupal
            key={salida.id}
            title={salida.title}
            description={salida.description}
            fechas={salida.fechas}
            precio={salida.precio}
            image={salida.image}
            itinerario={salida.itinerario}
          />
        ))}
      </Stack>
    </Stack>
  )
}

Seccion5.propTypes = {
  id: PropTypes.string,
}

export default Seccion5

