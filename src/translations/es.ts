export const es = {
  locale: 'es',
  project: {
    name: 'PostureDock',
    repoName: 'posture-dock',
    packageName: 'posture-dock',
    tagLine: 'Tracking de postura con webcam, historial y reportes'
  },
  metadata: {
    title: 'PostureDock',
    description:
      'Verificador de postura con webcam, alertas en vivo, historial y reporte final con sugerencias de mejora.'
  },
  appShell: {
    personalProject: 'Personal project',
    focusLabel: 'Focus',
    focusTitle: 'Webcam, senales posturales y reporte sin friccion.',
    focusCopy:
      'La UI vive como herramienta operativa: primero capturas, luego corriges, despues comparas.'
  },
  page: {
    eyebrow: 'Posture workspace',
    title: 'Una mesa de control de postura que se siente como herramienta',
    description:
      'La experiencia se reorganiza alrededor de una sola tarea: grabar una sesion de trabajo, detectar desalineaciones con menos friccion y revisar despues el progreso con contexto.',
    overviewCards: [
      {
        label: 'Captura',
        title: 'Una sesion libre y continua',
        copy:
          'Inicias cuando ya estas acomodado, corriges en vivo y detienes solo al cerrar el bloque.'
      },
      {
        label: 'Lectura',
        title: 'Indicadores claros en la misma vista',
        copy:
          'Torso, cabeza, hombros y confianza del tracking quedan visibles sin romper el foco.'
      },
      {
        label: 'Analisis',
        title: 'Historial, comparativa y reporte',
        copy:
          'Cada sesion guardada puede reabrirse, exportarse a PDF y compararse con las anteriores.'
      }
    ]
  },
  common: {
    sessionSource: {
      local: 'local',
      supabase: 'supabase',
      localSupabase: 'local+supabase'
    },
    tones: {
      good: 'good',
      warn: 'warn',
      alert: 'alert',
      idle: 'idle'
    },
    buttons: {
      close: 'Cerrar',
      downloadPdf: 'Descargar PDF',
      viewReport: 'Ver reporte',
      delete: 'Eliminar',
      pdf: 'PDF',
      reset: 'Reset'
    },
    unavailable: 'no disponible',
    issueLabels: {
      lean: 'Torso inclinado',
      headForward: 'Cabeza adelantada',
      shoulders: 'Hombros tensos',
      offCenter: 'Fuera del centro'
    },
    issueDetailedLabels: {
      lean: 'Inclinacion del torso',
      headForward: 'Cabeza adelantada',
      shoulders: 'Tension o desnivel de hombros',
      offCenter: 'Desplazamiento lateral'
    },
    focusLabels: {
      balanced: 'balance general',
      habits: 'habitos de trabajo',
      lean: 'torso inclinado',
      headForward: 'cabeza adelantada',
      shoulders: 'hombros tensos',
      offCenter: 'desplazamiento lateral'
    },
    cameraDefault: 'Camara por defecto',
    cameraFallback: (index: number) => `Camara ${index + 1}`
  },
  dashboard: {
    syncLabels: {
      idle: 'Ready',
      synced: 'Supabase synced',
      localFailed: 'Solo local',
      localOnly: 'Browser storage'
    },
    scoreLabels: {
      ready: 'Lista',
      preparing: 'Preparando'
    },
    sections: {
      workspaceLabel: 'Workspace',
      workspaceTitle: 'Cabina de seguimiento',
      workspaceCopy:
        'La experiencia prioriza una sola tarea: iniciar, vigilar, corregir y luego revisar el historial sin saltar entre cajas desconectadas.',
      mainViewLabel: 'Vista principal',
      mainViewTitle: 'Camara y lectura corporal',
      mainViewCopy:
        'La camara queda al centro y los indicadores claves debajo para corregirte sin distraerte con controles secundarios.',
      settingsLabel: 'Ajustes',
      settingsTitle: 'Camara y alertas',
      todayLabel: 'Today',
      todayTitle: 'Resumen del dia',
      todayCopy:
        'Vista rapida de tiempo acumulado y tendencia entre sesiones guardadas.',
      historyLabel: 'History',
      historyTitle: 'Sesiones guardadas',
      historyCopy:
        'Reabre reportes, exporta PDF y compara la progresion de cada bloque de trabajo.',
      engineStateLabel: 'Estado del motor'
    },
    buttons: {
      retryCamera: 'Reintentar camara',
      startRecording: 'Iniciar recording',
      stopAndSave: 'Detener y guardar',
      latestReport: 'Ver ultimo reporte'
    },
    sessionStats: {
      session: 'Sesion',
      sessionActiveCopy: 'La grabacion sigue activa hasta que la detengas.',
      sessionIdleCopy:
        'La medicion es libre. Inicia solo cuando ya estes acomodado.',
      persistence: 'Persistencia',
      today: 'Hoy',
      todaySessions: (count: number) => `${count} sesiones`,
      todayMeasured: (time: string) => `${time} medidos en el dia.`,
      latestScore: 'Ultimo score',
      latestScoreMissing: '--',
      latestScoreDate: (date: string) => `Ultima sesion guardada el ${date}.`,
      latestScoreEmpty: 'Todavia no hay una sesion cerrada para comparar.'
    },
    live: {
      preview: 'Vista previa',
      activeSession: 'Sesion en curso',
      recording: 'Recording',
      modelReady: 'Modelo listo',
      noAlerts: 'Sin alertas activas',
      noAlertsCopy:
        'El sistema no detecta una desviacion relevante en este momento.',
      issueFallback:
        'Ajusta la alineacion para volver a una postura neutral.',
      stableTracking: 'Tracking estable'
    },
    metrics: {
      torso: 'Torso',
      head: 'Cabeza',
      shoulders: 'Hombros',
      tracking: 'Tracking'
    },
    controls: {
      camera: {
        label: 'Camara',
        title: 'Camara',
        copy: 'Ajusta el encuadre antes de iniciar una sesion.',
        zoom: (value: string) => `Zoom ${value}`
      },
      sensitivity: {
        title: 'Sensibilidad',
        copy:
          'Define desde que punto una desviacion pasa a ser una alerta.',
        lean: (value: number) => `Torso inclinado: ${value} deg`,
        head: (value: number) => `Cabeza adelantada: ${value} cm`,
        offset: (value: number) => `Desplazamiento lateral: ${value} cm`
      },
      alerts: {
        title: 'Alertas',
        copy: 'Ajusta frecuencia, carga de inferencia y aviso sonoro.',
        interval: 'Intervalo de alerta',
        sound: 'Alertas sonoras',
        inference: 'Velocidad de inferencia',
        intervals: [
          { label: '5 segundos', value: 5000 },
          { label: '10 segundos', value: 10000 },
          { label: '15 segundos', value: 15000 }
        ],
        inferenceOptions: [
          { label: '1/1 frames', value: 1 },
          { label: '1/2 frames', value: 2 },
          { label: '1/4 frames', value: 4 },
          { label: '1/6 frames', value: 6 }
        ]
      }
    },
    descriptions: {
      ready:
        'Webcam activa y modelo listo. La sesion es libre: empieza cuando quieras y frenala manualmente.',
      blocked:
        'No se pudo acceder a la webcam. Revisa permisos del navegador.',
      unsupported: 'El navegador no soporta getUserMedia.',
      connecting: 'Solicitando acceso a la webcam...',
      loadingModel: 'Webcam lista. Cargando el modelo de postura...',
      idle:
        'Prepara la camara, ajusta valores y empieza la sesion cuando quieras.'
    },
    today: {
      totalTrackingTime: 'Total tracking time',
      badPostureTime: 'Bad posture time',
      badPosturePercentage: 'Bad posture percentage',
      averageScore: 'Average score'
    },
    history: {
      emptyTitle: 'No hay sesiones guardadas aun.',
      emptyCopy:
        'Inicia un recording, detenlo manualmente y aparecera aqui.',
      score: 'Score',
      focus: 'foco',
      formatLine: (time: string, focus: string) => `${time} · foco ${focus}`
    }
  },
  auth: {
    label: 'Cuenta',
    title: 'Acceso y sincronizacion',
    unavailableTitle: 'Supabase no esta configurado.',
    unavailableCopy:
      'La app funciona en modo local hasta que definas las variables de entorno.',
    authenticatedFallback: 'Usuario autenticado',
    authenticatedCopy:
      'Tus sesiones nuevas y el historial quedan asociados a esta cuenta.',
    emailLabel: 'Email',
    emailPlaceholder: 'tu@email.com',
    sendMagicLink: 'Enviar magic link',
    resendMagicLink: 'Reenviar link',
    signOut: 'Cerrar sesion'
  },
  reportModal: {
    titleLabel: 'Reporte de sesion',
    sessionSummary: (date: string, duration: string, score: number) =>
      `${date} · ${duration} · score general ${score}`,
    scores: {
      overall: {
        label: 'Overall',
        detail: 'Calidad general de la sesion.'
      },
      posture: {
        label: 'Postura',
        detail: 'Alineacion promedio del cuerpo.'
      },
      stability: {
        label: 'Estabilidad',
        detail: 'Cuanto tiempo la sostuviste.'
      },
      recovery: {
        label: 'Recuperacion',
        detail: 'Que tan rapido volviste al eje.'
      }
    },
    usefulStats: 'Datos utiles',
    issueBreakdown: 'En que estas fallando',
    insights: 'Insights',
    recommendations: 'Como mejorar',
    affectedTime: (percent: number) => `${percent}% del tiempo`,
    excess: (value: number) => `exceso ${value}`
  },
  charts: {
    comparison: {
      emptyTitle: 'Sin comparativa aun',
      emptyCopy:
        'Guarda varias sesiones para ver la tendencia de score entre sesiones.',
      title: 'Comparativa entre sesiones',
      recentSessions: (count: number) => `${count} sesiones recientes`
    },
    timeline: {
      title: 'Timeline de la sesion',
      lean: 'Torso',
      head: 'Cabeza',
      alerts: 'Alertas'
    }
  },
  hook: {
    defaultReportTitle: 'Sesion libre de postura',
    initialEngineMessage: 'Listo para iniciar medicion.',
    loadingPersistence: 'Cargando estado de persistencia...',
    postureStable: 'Postura estable. Sigue trabajando normal.',
    returnNeutral: 'Ajusta la postura para volver a una posicion neutral.',
    loadingModel: 'Webcam lista. Cargando el modelo de postura...',
    modelReady:
      'Modelo listo. Inicia una sesion libre y detenla cuando quieras guardar el tracking.',
    modelLoadError:
      'No fue posible cargar MediaPipe. La app necesita red para descargar el runtime y el modelo.',
    zoomRejected: 'La camara actual no acepto el ajuste de zoom.',
    notEnoughData:
      'No hubo datos suficientes para guardar. Intenta una sesion un poco mas larga.',
    sessionSaved:
      'Sesion guardada. Abre el reporte cuando quieras desde el panel o el historial.',
    syncSavedRemote: 'Sesion guardada y sincronizada con Supabase.',
    syncSavedPromptLogin:
      'Sesion guardada localmente. Inicia sesion para sincronizarla.',
    syncFailed:
      'Se guardo localmente, pero la sincronizacion fallo.',
    syncSavedLocalPending:
      'Sesion guardada localmente. Falta sincronizar en remoto.',
    syncSavedBrowser: 'Sesion guardada localmente en el navegador.',
    auth: {
      sendingLink: 'Enviando link',
      resendLink: 'Reenviando link',
      signingOut: 'Cerrando sesion',
      magicLinkCheckInbox:
        'Revisa tu correo. El magic link inicia la sesion y habilita sync remoto.',
      resentMagicLink: (email: string) => `Se reenvio el magic link a ${email}.`,
      signedOut: 'Sesion cerrada. Quedas en modo local.'
    },
    status: {
      activeUser: (user: string) => `Sesion activa como ${user}.`,
      localModePrompt:
        'Modo local activo. Inicia sesion para guardar historial por usuario.',
      localModeOnly: 'Supabase no configurado. Modo local activo.',
      signedInAs: (user: string) => `Sesion iniciada como ${user}.`,
      remoteHistoryStopped:
        'Sesion cerrada. El historial remoto deja de cargarse.'
    },
    tracking: {
      sessionStarted:
        'Sesion libre iniciada. Cuando quieras terminar y guardar, presiona detener.',
      modelReadyStartNew: 'Modelo listo. Puedes empezar una nueva sesion.'
    }
  },
  report: {
    recommendations: {
      leanStack: {
        id: 'lean-stack',
        title: 'Recupera el apilado del torso',
        detail:
          'Acerca la silla al escritorio, reparte el peso entre ambos isquiones y piensa en crecer desde la coronilla. Si te inclinas para ver la pantalla, el setup esta empujando mala postura.'
      },
      headForward: {
        id: 'head-forward',
        title: 'Corrige la cabeza adelantada',
        detail:
          'Sube o acerca la pantalla para no perseguirla con la barbilla. Mantener orejas mas alineadas con los hombros suele reducir fatiga cervical rapido.'
      },
      shouldersRelax: {
        id: 'shoulders-relax',
        title: 'Quita tension de hombros',
        detail:
          'Deja los codos mas cerca del cuerpo y revisa altura de teclado o apoyabrazos. Si un hombro sube o cae mas que el otro, probablemente estas compensando con cuello y trapecio.'
      },
      centering: {
        id: 'centering',
        title: 'Vuelve al centro de la silla',
        detail:
          'Tu tronco se desplaza lateralmente con frecuencia. Asegura ambos pies apoyados y evita trabajar girado respecto al monitor.'
      },
      microBreaks: {
        id: 'micro-breaks',
        title: 'Introduce micro pausas antes de degradarte',
        detail:
          'Cuando la postura buena dura poco, la solucion no es solo corregir mas fuerte sino resetear antes. Una pausa breve cada 25 a 30 minutos ayuda a sostener mejor tecnica.'
      },
      balanced: {
        id: 'balanced',
        title: 'Mantienes una base razonable',
        detail:
          'El siguiente paso no es mas sensibilidad sino mas consistencia. Prueba sesiones mas largas para ver en que minuto empieza a caer la alineacion.'
      }
    },
    usefulStats: {
      measuredTime: 'Tiempo medido',
      neutralPosture: 'Postura neutra',
      alertsEmitted: 'Alertas emitidas',
      maxBadStreak: 'Max. racha mala',
      averageLean: 'Inclinacion media',
      trackingConfidence: 'Confianza tracking'
    },
    insights: {
      neutralRatio: (percent: number) =>
        `La postura se mantuvo neutral durante ${percent}% de la sesion.`,
      longestBadStreak: (seconds: number) =>
        `La racha mas larga con mala postura fue de ${seconds} segundos.`,
      dominantFocus: (focus: string) => `El foco principal fue ${focus}.`
    }
  },
  pdf: {
    title: 'PostureDock Report',
    startedLine: (date: string, duration: string, source: string) =>
      `Iniciada ${date}. Duracion ${duration}. Fuente ${source}.`,
    cameraLine: (cameraLabel: string, alertCount: number, neutralPercent: number) =>
      `Usuario: ${cameraLabel}. Alertas ${alertCount}. Neutral ${neutralPercent}%.`,
    sections: {
      scores: 'Scores',
      usefulStats: 'Datos utiles',
      detectedIssues: 'Problemas detectados',
      recommendations: 'Recomendaciones'
    },
    scoresLine: (
      overall: number,
      posture: number,
      stability: number,
      recovery: number,
      focus: number
    ) =>
      `Overall ${overall} | Postura ${posture} | Estabilidad ${stability} | Recuperacion ${recovery} | Foco ${focus}`,
    issueLine: (
      label: string,
      affectedPercent: number,
      averageExcess: number,
      severity: string
    ) =>
      `${label}: ${affectedPercent}% del tiempo, exceso medio ${averageExcess}, severidad ${severity}.`,
    recommendationLine: (title: string, severity: string, detail: string) =>
      `${title} (${severity}): ${detail}`,
    fileName: (id: string) => `posture-report-${id}.pdf`
  }
} as const;
