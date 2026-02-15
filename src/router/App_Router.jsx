import { Route, Routes } from "react-router-dom";
import Homepage from "../pages/Homepage";











export const App_Router = () => {
    
    return (
        <Routes>
          
          <Route path="/*" element={<Homepage/>} />
          {/* <Route path="/politicas-privacidad" element={<PoliticasPrivacidad/>} />
          <Route path="/success" element={<FormSucces/>} /> */}
          
    
            
        </Routes>
    );
};