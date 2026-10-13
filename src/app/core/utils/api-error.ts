export function apiError(error: {
  status?: number;
  error?: { errorCode?: string; validationErrors?: Record<string, unknown> };
}): string {
  const messages: Record<string, string> = {
    PASSWORD_CHANGE_REQUIRED: 'Altere sua senha inicial antes de continuar.',
    PET_NOT_FOUND: 'Este pet não foi encontrado para sua organização.',
    FORBIDDEN_ACCESS: 'Sua organização não tem permissão para alterar este pet.',
    PET_MAX_IMAGES_EXCEEDED: 'Cada pet pode ter no máximo 4 fotos.',
    PET_IMAGE_TOO_LARGE: 'A foto deve ter no máximo 10 MB.',
    PET_IMAGE_INVALID_FORMAT: 'Use fotos JPEG, PNG, WebP ou AVIF.',
    INVALID_VACCINE_DATE: 'A data de vacinação não pode estar no futuro.',
    INVALID_CREDENTIALS: 'A senha atual está incorreta.',
  };
  const code = error.error?.errorCode;
  if (code && messages[code]) return messages[code];
  if (error.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (error.status === 429) return 'Muitas solicitações. Aguarde um momento e tente novamente.';
  if (error.status === 413) return 'Os arquivos enviados são grandes demais.';
  if (error.status === 400 || error.status === 422)
    return 'Confira os campos e tente novamente. Nome e descrição são obrigatórios; idade deve ser um número inteiro de 0 a 99.';
  return 'Não foi possível concluir a operação. Confira sua conexão e tente novamente.';
}
