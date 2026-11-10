COMPOSE = docker compose -p ft_transcendence -f devops/docker-compose.yml

all: help

help:
	@echo "Ft_transcendence - Available commands:"
	@echo ""
	@echo "  make help              Show this help message"
	@echo "  make up                Start services in detached mode"
	@echo "  make build             Build project images"
	@echo "  make down              Stop and remove containers and networks"
	@echo "  make logs              Follow service logs"
	@echo "  make ps                Show service status"
	@echo "  make restart           Restart services"
	@echo "  make clean             Remove containers, networks and project volumes"
	@echo "  make clean-containers  Remove containers and local images, preserve volumes"
	@echo "  make fclean            Remove containers, networks, volumes and local images"
	@echo "  make re                Fully clean, rebuild and start the project"

up:
	$(COMPOSE) up -d --build

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

clean-containers:
	$(COMPOSE) down --remove-orphans --rmi local

fclean:
	$(COMPOSE) down --volumes --remove-orphans --rmi local

re: fclean build up

.PHONY: all help up build down logs ps restart clean clean-containers fclean re