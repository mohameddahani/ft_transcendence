COMPOSE = docker compose -f devops/docker-compose.yml

all: up

up:
	$(COMPOSE) up 

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

fclean: clean
	docker system prune -af

re: fclean build up 

.PHONY: all up build down logs ps restart clean fclean re
