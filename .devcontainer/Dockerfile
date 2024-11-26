FROM rust:1.77.2-slim AS builder
ARG VERSION=v2.4.1

RUN apt-get update && apt-get install -y \
    git \
    clang \
    libsqlite3-dev \
    pkg-config \
    libssl-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work

RUN git clone -b ${VERSION} --single-branch --depth 1 https://github.com/Conflux-Chain/conflux-rust.git conflux 

WORKDIR /work/conflux

RUN export CC=clang && export CXX=clang++ && cargo build --release


# Stage 2: Use the official Node.js slim image as the base for the development kit
FROM ubuntu:latest AS conflux

# Define build arguments for Conflux node configuration
ARG CONFLUX_NODE_ROOT="/opt/conflux"

# Install necessary dependencies and clean up apt lists to reduce image size
RUN apt-get update && apt-get install -y --no-install-recommends \ 
        git \
        sudo \
        ca-certificates \
        curl \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy Conflux binaries from the release stage to the current stage
COPY --from=builder /bin/conflux /bin/conflux
COPY --from=builder /bin/cfxkey /bin/cfxkey
COPY --from=builder /bin/pos-genesis-tool /bin/pos-genesis-tool
COPY --from=builder /bin/cfx-gen-dot /bin/cfx-gen-dot
COPY --from=builder /bin/cfxstore /bin/cfxstore
# Create necessary directories for Conflux node operation
RUN mkdir -p ${CONFLUX_NODE_ROOT} /workspaces

# Set environment variables for chain IDs and configuration paths
ENV CONFLUX_NODE_ROOT=${CONFLUX_NODE_ROOT}
# Define build arguments for user creation
ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Add utility scripts and templates to the image

# Create a new user if $USERNAME doesn't exist
RUN id -u $USERNAME >/dev/null 2>&1 || (groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USERNAME -m -s /bin/bash $USERNAME)

# Configure passwordless sudo for the created user
RUN echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Change ownership of the Conflux node directory to the created user
RUN chown -R ${USERNAME}:${USERNAME} ${CONFLUX_NODE_ROOT} /workspaces

# Expose necessary ports for the Conflux node
EXPOSE 12535 12537 8545 8546

# Switch to the created user context
USER $USERNAME 


FROM conflux AS devkit-vscode
 
# Set the working directory for the user
WORKDIR /workspaces/

# Set additional environment variables for the user
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    EDITOR=code \
    VISUAL=code \
    GIT_EDITOR="code --wait"

FROM devkit-vscode AS devkit-deno
# Deno install
USER root
COPY --from=denoland/deno:bin-2.1.0 /deno /usr/local/bin/deno
USER $USERNAME 


FROM devkit-deno AS devkit-build
USER root
COPY .. .
RUN deno task release
RUN cp release/usr/local/bin/devkit /bin/devkit

FROM ubuntu:latest AS devkit-release
USER root
COPY --from=devkit-build /bin/devkit /bin/devkit
COPY --from=builder /bin/conflux /bin/conflux
COPY --from=builder /bin/cfxkey /bin/cfxkey
COPY --from=builder /bin/pos-genesis-tool /bin/pos-genesis-tool
COPY --from=builder /bin/cfx-gen-dot /bin/cfx-gen-dot
COPY --from=builder /bin/cfxstore /bin/cfxstore
