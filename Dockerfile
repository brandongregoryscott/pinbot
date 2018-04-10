FROM ubuntu
MAINTAINER Brandon Scott

RUN apt update -y -q && apt install -y -q python3 python3-pip
RUN pip3 install --upgrade pip slackclient

CMD ["python3", "/pinbot/pinbot.py"]

# docker build -t pinbot ~/pinbot/
# docker run --name pinbot -e TZ=America/New_York --restart=always --log-opt max-size=1024kb --volume ~/pinbot/:/pinbot/ -d pinbot
