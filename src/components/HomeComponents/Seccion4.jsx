import { Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { fetchSeccion4Data } from '../../store/seccion4Slice'

const CardService = ({ image, title, title2, description }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const computer = useMediaQuery('(min-width: 1025px) and (max-width: 1599px)')
  const iconSize = isMobile ? 42 : computer ? 62 : 72
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1.25}
      style={{ width: '100%', maxWidth: isMobile ? '100%' : '460px', height: isMobile ? '72px' : computer ? '122px' : '130px' }}
    >
      <Stack style={{ width: `${iconSize}px`, minWidth: `${iconSize}px` }} alignItems="center" justifyContent="center">
        <img
          src={image}
          alt={title}
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        />
      </Stack>
      <Stack
        direction="column"
        alignItems="flex-start"
        justifyContent="flex-start"
        spacing={0}
        style={{ minWidth: isMobile ? '220px' : computer ? '280px' : '320px' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          spacing={1}
          style={{ borderBottom: '1px solid #C39D65' }}
        >
          <Typography className="service-title">{title}</Typography>
          <Typography className="service-title2">{title2}</Typography>
        </Stack>
        {/* <Typography className="service-description">{description}</Typography> */}
      </Stack>
    </Stack>
  )
}

CardService.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  title2: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}

const Seccion4 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const title = useSelector((state) => state.seccion4.title)
  const services = useSelector((state) => state.seccion4.services)

  useEffect(() => {
    dispatch(fetchSeccion4Data())
  }, [dispatch])

  if (!Array.isArray(services) || services.length === 0) {
    return null
  }

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={0}
      style={{ padding: isMobile ? '0 0.75rem 0.5rem' : '0 2.5rem 1.25rem', backgroundColor: '#000' }}
    >
      <Typography
        className="seccion3-title"
        style={{ width: isMobile ? '100%' : '90%', paddingTop: 0, paddingBottom: isMobile ? '0.5rem' : '0.75rem', textAlign: 'center' }}
      >
        {title}
      </Typography>
      <Stack
        style={{
          width: isMobile ? '100%' : '90%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(320px, 460px))',
          justifyContent: 'center',
          columnGap: isMobile ? '0px' : '140px',
          rowGap: '0px',
        }}
      >
        {services.map((service) => (
          <Stack
            key={service.id}
            direction="column"
            alignItems="center"
            justifyContent="flex-start"
            spacing={0}
            style={{ width: '100%' }}
          >
            <CardService
              image={service.image}
              title={service.title}
              title2={service.title2}
              description={service.description}
            />
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

Seccion4.propTypes = {
  id: PropTypes.string,
}

export default Seccion4

