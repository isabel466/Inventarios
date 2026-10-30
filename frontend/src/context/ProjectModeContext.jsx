import React, { createContext, useContext, useState } from 'react';

const ProjectModeContext = createContext();

export const ProjectModeProvider = ({ children }) => {
  // Avance activo: false = versión completa con todos los módulos desbloqueados
  const [isAvanceMode, setIsAvanceMode] = useState(false);

  return (
    <ProjectModeContext.Provider
      value={{
        isAvanceMode,
        setIsAvanceMode,
        progressPercentage: isAvanceMode ? 50 : 100
      }}
    >
      {children}
    </ProjectModeContext.Provider>
  );
};

export const useProjectMode = () => useContext(ProjectModeContext);
