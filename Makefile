COMPOSE = docker compose -p ft_transcendence -f devops/docker-compose.yml

all: up

up:
	$(COMPOSE) up -d

build:
	$(COMPOSE) build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart

clean:
	$(COMPOSE) down --volumes --remove-orphans

fclean:
	$(COMPOSE) down --volumes --remove-orphans --rmi local

re: fclean build up

.PHONY: all up build down logs ps restart clean fclean re