import { Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { fetchAfiliados } from '../../store/afiliadosSlice'

const Afiliados = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const title = useSelector((state) => state.afiliados.title)
  const logos = useSelector((state) => state.afiliados.logos)
  const shouldAnimate = logos.length > 2
  const loopCopies = shouldAnimate ? [0, 1] : [0]

  useEffect(() => {
    dispatch(fetchAfiliados())
  }, [dispatch])

  if (!Array.isArray(logos) || logos.length === 0) {
    return null
  }

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="flex-start"
      justifyContent="center"
      spacing={4}
      style={{ width: '100%', padding: isMobile ? '8% 0' : '2% 0', backgroundColor: '#000' }}
    >
      <Typography className="seccion2-title">{title}</Typography>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#C39D65' }} />
      <Stack
        className={`seccion2-marquee ${!shouldAnimate ? 'seccion2-marquee-static' : ''}`}
        direction="row"
        alignItems="center"
      >
        <Stack
          className={`seccion2-track ${!shouldAnimate ? 'seccion2-track-static' : ''}`}
          direction="row"
          alignItems="center"
        >
          {loopCopies.map((dup) => (
            <Stack className="seccion2-group" direction="row" alignItems="center" key={`afiliados-group-${dup}`}>
              {logos.map((logo) => (
                <Stack className="seccion2-item" key={`${logo.id}-${dup}`}>
                  <a href={logo.url} target="_blank" rel="noopener noreferrer">
                    <img className="seccion2-logo" src={logo.image} alt={`logo-${logo.id}`} loading="lazy" />
                  </a>
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      </Stack>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#C39D65' }} />
    </Stack>
  )
}

Afiliados.propTypes = {
  id: PropTypes.string,
}

export default Afiliados
