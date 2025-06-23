import React, { createContext, useContext, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FiUser, FiLock } from 'react-icons/fi';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import 'atropos/css'
import Formulario5 from "./formulario5";
import Formulario1 from './formulario1';
import { handleLoginMrx } from './api/picoYPlacaApi';

 const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (success) => {
    // Simulación de login: reemplaza con tu fetch real
    if (success === 'OK') {
      setUser({estado:success});
      speechSynthesis.speak(new SpeechSynthesisUtterance("Bienvenido al sistema"));

      return true;
    }else{
       return false;
    }
   
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      identificacion: '',
      clave: '',
    },
    validationSchema: Yup.object({
      identificacion: Yup.string().required('Requerido'),
      clave: Yup.string().required('Requerido'),
    }),
    onSubmit: async (values) => {
     
 try {
   const success = await handleLoginMrx(values)
     const success1 = await login(success.result ); //login(values.identificacion, values.clave);
      if (success1) navigate('/dashboard');
    
 } catch (error) {
   alert('Credenciales inválidas');
   
 }
}
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 text-white">
      <form
        onSubmit={formik.handleSubmit}
        className="glass-card p-4 rounded shadow-lg text-white"
      >
        <h2 className="text-center mb-4  text-black ">Iniciar Sesión</h2>

        <div className="form-floating mb-3 position-relative">
          <input
            id="identificacion"
            name="identificacion"
            type="text"
            className="form-control bg-transparent text-black border-light"
            placeholder="Identificación"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.identificacion}
          />
          <label htmlFor="identificacion">
            <FiUser className="" /> Identificación
          </label>
          {formik.touched.identificacion && formik.errors.identificacion && (
            <div className="text-danger small mt-1">{formik.errors.identificacion}</div>
          )}
        </div>

        <div className="form-floating mb-3 position-relative">
          <input
            id="clave"
            name="clave"
            type="password"
            className="form-control bg-transparent  text-black border-light"
            placeholder="Clave"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.clave}
          />
          <label htmlFor="clave">
            <FiLock className="me-2" /> Clave
          </label>
          {formik.touched.clave && formik.errors.clave && (
            <div className="text-danger small mt-1">{formik.errors.clave}</div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Entrar
        </button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const { logout } = useAuth();
  return (
    <div className="container mt-5">
      
      <button onClick={logout} className="btn btn-link mt-3">
        Cerrar sesión
      </button>
      <Formulario5/>
    </div>
  );
};

function App() {
 
    return (
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
    );
}

export default App;