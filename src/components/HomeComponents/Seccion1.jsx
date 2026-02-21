import { Box, Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect, useState } from 'react'
import PropTypes from "prop-types";

const slides = [
    {
        id: 1,
        image: '/images/SliderPrinc1.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 2,
        image: '/images/SliderPrinc2.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 3,
        image: '/images/SliderPrinc3.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 4,
        image: '/images/SliderPrinc4.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 5,
        image: '/images/SliderPrinc5.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 6,
        image: '/images/SliderPrinc6.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    },
    {
        id: 7,
        image: '/images/SliderPrinc7.jpg',
        title: 'Viajes creados con logica, experiencia',
        subtitle: 'y pasión por el detalle'
    }
]

const Seccion1 = ({ id }) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const [currentIndex, setCurrentIndex] = useState(0)
    const [transitionEnabled, setTransitionEnabled] = useState(true)
    const transitionMs = 1500

    const slidesWithClone = slides.length === 0 ? [] : [...slides, slides[0]]

    useEffect(() => {
        if (slides.length === 0) {
            return undefined
        }

        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => prevIndex + 1)
        }, 5000)

        return () => clearInterval(intervalId)
    }, [])

    useEffect(() => {
        if (transitionEnabled) {
            return undefined
        }

        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(() => setTransitionEnabled(true))
        })

        return () => cancelAnimationFrame(rafId)
    }, [transitionEnabled])

    useEffect(() => {
        if (currentIndex > slides.length) {
            setTransitionEnabled(false)
            setCurrentIndex(0)
            return undefined
        }

        if (currentIndex !== slides.length) {
            return undefined
        }

        const timeoutId = setTimeout(() => {
            setTransitionEnabled(false)
            setCurrentIndex(0)
        }, transitionMs)

        return () => clearTimeout(timeoutId)
    }, [currentIndex, transitionMs])

    if (slides.length === 0) {
        return null
    }

  return (
    <Box id={id} className="seccion1-container">
        
        <Box
            className="seccion1-track"
            style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                transition: transitionEnabled ? undefined : 'none'
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
                        alignItems="flex-start"
                        style={{paddingLeft: isMobile ? "2rem" : "7rem", paddingTop: isMobile ? "5rem" : "6em"}}
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
};

export default Seccion1
