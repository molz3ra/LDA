import time
from collections import defaultdict
from typing import Tuple


class ShowcaseRateLimiter:
    """
    Rate Limiter de Memória para Projetos de Demonstração / Portfólio.
    Limita requisições por IP em uma janela deslizante (ex: 15 perguntas a cada 30 minutos).
    """

    def __init__(self, max_requests: int = 15, window_seconds: int = 1800):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int, int]:
        """
        Retorna (permitido: bool, tempo_restante_segundos: int, requisicoes_atuais: int)
        """
        now = time.time()
        # Filtrar apenas requisições dentro da janela de tempo atual
        valid_timestamps = [t for t in self.history[client_ip] if now - t < self.window_seconds]
        self.history[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            oldest_timestamp = valid_timestamps[0]
            remaining_seconds = int(self.window_seconds - (now - oldest_timestamp))
            return False, max(1, remaining_seconds), len(valid_timestamps)

        valid_timestamps.append(now)
        self.history[client_ip] = valid_timestamps
        return True, 0, len(valid_timestamps)


# Instância global do limitador de demonstração (15 requisições por IP a cada 30 minutos)
demo_limiter = ShowcaseRateLimiter(max_requests=15, window_seconds=1800)
