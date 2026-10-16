import React, { createContext, useContext } from 'react';

const ProjectModeContext = createContext();

export const ProjectModeProvider = ({ children }) => {
  // Fijo al 50% de avance para la entrega de hito intermedio
  const isAvanceMode = true;

  return (
    <ProjectModeContext.Provider
      value={{
        isAvanceMode,
        progressPercentage: 50
      }}
    >
      {children}
    </ProjectModeContext.Provider>
  );
};

export const useProjectMode = () => useContext(ProjectModeContext);
