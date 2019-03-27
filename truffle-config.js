module.exports = {
  migrations_directory: './migrations',
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    // these're for executing commands 'compile', 'migrate' in ganache attached truffle
    // restore below comments within rainbow-dot repo
    // for executing test codes, don't restore below comments
    test: {
      host: 'localhost',
      port: 7545,
      network_id: 5777
    }
  },
  compilers: {
    solc: {
      version: '0.4.24',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
