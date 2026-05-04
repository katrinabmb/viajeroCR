import { Box, Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { fetchSeccion1Slides } from '../../store/seccion1Slice'

const Seccion1 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const slides = useSelector((state) => state.seccion1.slides)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const transitionMs = 1500

  const slidesWithClone = slides.length === 0 ? [] : [...slides, slides[0]]

  useEffect(() => {
    dispatch(fetchSeccion1Slides())
  }, [dispatch])

  useEffect(() => {
    if (slides.length === 0) return undefined

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [slides.length])

  useEffect(() => {
    if (transitionEnabled) return undefined

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionEnabled(true))
    })

    return () => cancelAnimationFrame(rafId)
  }, [transitionEnabled])

  useEffect(() => {
    if (slides.length === 0) return undefined

    if (currentIndex > slides.length) {
      setTransitionEnabled(false)
      setCurrentIndex(0)
      return undefined
    }

    if (currentIndex !== slides.length) return undefined

    const timeoutId = setTimeout(() => {
      setTransitionEnabled(false)
      setCurrentIndex(0)
    }, transitionMs)

    return () => clearTimeout(timeoutId)
  }, [currentIndex, slides.length, transitionMs])

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0)
    }
  }, [slides.length, currentIndex])

  if (slides.length === 0) return null

  return (
    <Box id={id} className="seccion1-container">
      <Box
        className="seccion1-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: transitionEnabled ? undefined : 'none',
        }}
      >
        {slidesWithClone.map((item, index) => (
          <Stack
            justifyContent="center"
            alignItems="flex-start"
            key={`${item.id}-${index}`}
            className="seccion1-slide"
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <Box className="seccion1-overlay" />
            <Stack
              className="seccion1-slide-content"
              direction="column"
              justifyContent="center"
              alignItems="center"
              style={{ paddingTop: isMobile ? '5rem' : '6em', width: '100%' }}
            >
              <Typography className="seccion1-title">{item.title}</Typography>
              <Typography className="seccion1-subtitle">{item.subtitle}</Typography>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}

Seccion1.propTypes = {
  id: PropTypes.string,
}

export default Seccion1

