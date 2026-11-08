#!/bin/bash
# Official-sample pattern (salad-cloud-job-queue-worker, samples/mandelbrot/
# with-shell-script): run the job queue worker and the workload side by side;
# if either exits, exit with its code so the platform restarts the container.
/usr/local/bin/salad-http-job-queue-worker &
./comfyui-api &
wait -n
exit $?
