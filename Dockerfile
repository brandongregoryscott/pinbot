FROM ubuntu
MAINTAINER Brandon Scott

RUN apt update -y -q
RUN apt install -y -q git python3 python3-pip
RUN pip3 install --upgrade pip
RUN pip3 install slackclient
RUN mkdir /pinbot/
RUN cd /pinbot/
RUN git init
RUN git remote add origin https://github.com/brandongregoryscott/pinbot.git
RUN git fetch
RUN git checkout -t origin/master


CMD ["python3", "/pinbot/pinbot.py"]
