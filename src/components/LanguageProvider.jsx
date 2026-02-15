import { createContext, useState } from 'react';
import translation from '../store/translation.json';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Por defecto en español 

  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'es' ? 'en' : 'es'));
  };

  return (
    <LanguageContext.Provider value={{ translation: translation[language], toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

//  const { translation, toggleLanguage } = useContext(LanguageContext);  

  
{/* <Button className='btnTranslate' onClick={toggleLanguage}>
<img src={translation.buttonText} style={{width:"69%"}} alt='language'/>
</Button> */}