sudo su
cd /otp/project/buildify-bakend
git pull
cd ../
cd /opt/project/ && docker compose up -d buildify-backend --build
