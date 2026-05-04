import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import { Avatar, IconButton, Stack, Typography, useMediaQuery } from '@mui/material'
import PropTypes from 'prop-types'
import { fetchTestimoniosData } from '../../store/testimoniosSlice'

const CardTestimonio = ({ destino, name, testimonio, photo }) => {
  const initial = name && name.length > 0 ? name.charAt(0) : '?'
  return (
    <Stack
      direction="column"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={1.25}
      className="card-testimonio"
    >
      <Avatar
        src={photo}
        alt={name}
        className="card-testimonio-avatar"
        sx={{ bgcolor: '#C39D65' }}
      >
        {initial}
      </Avatar>

      <Typography className="card-testimonio-destino">
        <span className="card-testimonio-label">Destino:</span>{' '}
        <span className="card-testimonio-value">{destino}</span>
      </Typography>
      <Typography className="card-testimonio-testimonio">{testimonio}</Typography>
      <Typography className="card-testimonio-name">
        <span className="card-testimonio-label">Autor:</span>{' '}
        <span className="card-testimonio-value">{name}</span>
      </Typography>
    </Stack>
  )
}

CardTestimonio.propTypes = {
  destino: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  testimonio: PropTypes.string.isRequired,
  photo: PropTypes.string,
}

const Testimonios = ({ id }) => {
  const dispatch = useDispatch()
  const title = useSelector((state) => state.testimonios.title)
  const testimonios = useSelector((state) => state.testimonios.testimonios)
  const recuerdos = useSelector((state) => state.testimonios.recuerdos)

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const itemRefs = useRef([])
  const carouselRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 600px)')

  useEffect(() => {
    dispatch(fetchTestimoniosData())
  }, [dispatch])

  const prefersReducedMotion =
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const scrollToIndex = useCallback((index) => {
    const carousel = carouselRef.current
    const node = itemRefs.current[index]
    if (!carousel || !node) return

    const left = node.offsetLeft
    carousel.scrollTo({
      left,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [prefersReducedMotion])

  const goToIndex = useCallback(
    (index) => {
      setActiveIndex(index)
      scrollToIndex(index)
    },
    [scrollToIndex]
  )

  const handleNext = useCallback(() => {
    if (testimonios.length === 0) return
    const nextIndex = (activeIndex + 1) % testimonios.length
    goToIndex(nextIndex)
  }, [activeIndex, goToIndex, testimonios.length])

  useEffect(() => {
    if (isPaused) return
    if (prefersReducedMotion) return
    if (testimonios.length < 2) return

    const intervalMs = 4500
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % testimonios.length
        scrollToIndex(nextIndex)
        return nextIndex
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isPaused, prefersReducedMotion, scrollToIndex, testimonios.length])

  useEffect(() => {
    if (activeIndex >= testimonios.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, testimonios.length])

  if (!Array.isArray(testimonios) || testimonios.length === 0) {
    return null
  }

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{
        paddingBottom: '4rem',
        backgroundColor: '#000',
        paddingTop: isMobile ? '1rem' : '2rem',
      }}
    >
      <Typography className="seccion3-title">{title}</Typography>

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
                  itemRefs.current[idx] = el
                }}
              >
                <CardTestimonio
                  destino={testimonio.destino}
                  name={testimonio.name}
                  testimonio={testimonio.testimonio}
                  photo={testimonio.photo}
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

      <Stack direction={isMobile ? 'column' : 'row'} alignItems="center" justifyContent="center" spacing={2} style={{ width: '100%' }}>
        <img src={recuerdos?.[0] || '/images/testimonio1.PNG'} alt="Testimonio 1" className="testimonio-image" />
        <img src={recuerdos?.[1] || '/images/testimonio2.PNG'} alt="Testimonio 2" className="testimonio-image" />
      </Stack>
    </Stack>
  )
}

Testimonios.propTypes = {
  id: PropTypes.string,
}

export default Testimonios

