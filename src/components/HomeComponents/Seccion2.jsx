import { Stack } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { fetchSeccion2Data } from '../../store/seccion2Slice'

const Seccion2 = ({ id }) => {
  const dispatch = useDispatch()
  const logos = useSelector((state) => state.seccion2.logos)
  const shouldAnimate = logos.length > 2
  const loopCopies = shouldAnimate ? [0, 1] : [0]

  useEffect(() => {
    dispatch(fetchSeccion2Data())
  }, [dispatch])

  if (!Array.isArray(logos) || logos.length === 0) {
    return null
  }

  return (
    <Stack id={id} direction="column" alignItems="flex-start" justifyContent="center" spacing={4} style={{ width: '100%', padding: '2% 0', backgroundColor: '#000' }}>
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
            <Stack className="seccion2-group" direction="row" alignItems="center" key={`partners-group-${dup}`}>
              {logos.map((logo) => (
                <Stack className="seccion2-item" key={`${logo.id}-${dup}`}>
                  <img className="seccion2-logo" src={logo.image} alt={`logo-${logo.id}`} loading="lazy" />
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

Seccion2.propTypes = {
  id: PropTypes.string,
}

export default Seccion2

