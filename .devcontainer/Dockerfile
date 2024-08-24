# Define build arguments for Node.js and Conflux release versions
ARG NODE_RELEASE=2.4.0
ARG BASE_IMAGE=ubuntu:latest

# Stage 1: Use the official Conflux Rust image as the base for building release artifacts
FROM confluxchain/conflux-rust:${NODE_RELEASE} AS release

# Stage 2: Use the official Node.js slim image as the base for the development kit
FROM ${BASE_IMAGE} AS conflux

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
COPY --from=release /bin/conflux /bin/conflux
COPY --from=release /bin/cfxkey /bin/cfxkey
COPY --from=release /bin/pos-genesis-tool /bin/pos-genesis-tool
COPY --from=release /bin/cfx-gen-dot /bin/cfx-gen-dot
COPY --from=release /bin/cfxstore /bin/cfxstore
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
COPY --from=denoland/deno:bin-1.46.1 /deno /usr/local/bin/deno
USER $USERNAME 


FROM devkit-deno AS devkit-build
USER root
COPY .. .
RUN deno task release
RUN cp release/usr/local/bin/devkit /bin/devkit

FROM ${BASE_IMAGE} AS devkit-release
USER root
COPY --from=devkit-build /bin/devkit /bin/devkit
COPY --from=release /bin/conflux /bin/conflux
COPY --from=release /bin/cfxkey /bin/cfxkey
COPY --from=release /bin/pos-genesis-tool /bin/pos-genesis-tool
COPY --from=release /bin/cfx-gen-dot /bin/cfx-gen-dot
COPY --from=release /bin/cfxstore /bin/cfxstore