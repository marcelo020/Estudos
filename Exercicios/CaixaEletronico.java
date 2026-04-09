import java.util.InputMismatchException;
import java.util.List;
import java.util.Scanner;

public class CaixaEletronico {
    private Scanner scanner = new Scanner(System.in);
    private static final String RED = "\033[0;31m";
    private static final String GREEN = "\033[0;32m";
    private static final String RESET = "\033[0m";

    public void menuConta(Conta conta, List<Conta> todasContas) {
        while (true) {
            System.out.println("\n=== Operações na Conta ===");
            System.out.println("1. Ver Saldo");
            System.out.println("2. Sacar");
            System.out.println("3. Depositar");
            System.out.println("4. Ver Saldo Disponível");
            System.out.println("5. Transferir");
            System.out.println("6. Ver Histórico");
            System.out.println("7. Voltar");
            System.out.print("Escolha uma opção: ");
            try {
                int opcao = scanner.nextInt();
                switch (opcao) {
                    case 1:
                        System.out.println(GREEN + "Saldo atual: R$ " + String.format("%.2f", conta.getSaldo()) + RESET);
                        break;
                    case 2:
                        System.out.print("Valor a sacar: R$ ");
                        double valorSaque = scanner.nextDouble();
                        if (conta.sacar(valorSaque)) {
                            System.out.println(GREEN + "Saque realizado com sucesso!" + RESET);
                        } else {
                            System.out.println(RED + "Saldo insuficiente ou valor inválido!" + RESET);
                        }
                        break;
                    case 3:
                        System.out.print("Valor a depositar: R$ ");
                        double valorDeposito = scanner.nextDouble();
                        if (valorDeposito > 0) {
                            conta.deposito(valorDeposito);
                            System.out.println(GREEN + "Depósito realizado com sucesso!" + RESET);
                        } else {
                            System.out.println(RED + "Valor deve ser positivo!" + RESET);
                        }
                        break;
                    case 4:
                        System.out.println(GREEN + "Saldo disponível: R$ " + String.format("%.2f", conta.saldoDisponivel()) + RESET);
                        break;
                    case 5:
                        transferir(conta, todasContas);
                        break;
                    case 6:
                        exibirHistorico(conta.getHistorico());
                        break;
                    case 7:
                        return;
                    default:
                        System.out.println(RED + "Opção inválida!" + RESET);
                }
            } catch (InputMismatchException e) {
                System.out.println(RED + "Entrada inválida! Digite um número." + RESET);
                scanner.nextLine(); // Limpar buffer
            }
        }
    }

    public void menuCartao(CartaoDeCredito cartao) {
        while (true) {
            System.out.println("\n=== Operações no Cartão de Crédito ===");
            System.out.println("1. Fazer Compra");
            System.out.println("2. Ver Limite Disponível");
            System.out.println("3. Ver Limite do Cartão");
            System.out.println("4. Ver Histórico");
            System.out.println("5. Voltar");
            System.out.print("Escolha uma opção: ");
            try {
                int opcao = scanner.nextInt();
                switch (opcao) {
                    case 1:
                        System.out.print("Valor da compra: R$ ");
                        double valorCompra = scanner.nextDouble();
                        if (cartao.compra(valorCompra)) {
                            System.out.println(GREEN + "Compra realizada com sucesso!" + RESET);
                        } else {
                            System.out.println(RED + "Limite insuficiente ou valor inválido!" + RESET);
                        }
                        break;
                    case 2:
                        System.out.println(GREEN + "Limite disponível: R$ " + String.format("%.2f", cartao.limiteDisponivel()) + RESET);
                        break;
                    case 3:
                        System.out.println(GREEN + "Limite do cartão: R$ " + String.format("%.2f", cartao.getLimite()) + RESET);
                        break;
                    case 4:
                        exibirHistorico(cartao.getHistorico());
                        break;
                    case 5:
                        return;
                    default:
                        System.out.println(RED + "Opção inválida!" + RESET);
                }
            } catch (InputMismatchException e) {
                System.out.println(RED + "Entrada inválida! Digite um número." + RESET);
                scanner.nextLine();
            }
        }
    }

    private void transferir(Conta contaOrigem, List<Conta> todasContas) {
        System.out.println("Contas disponíveis para transferência:");
        for (int i = 0; i < todasContas.size(); i++) {
            Conta c = todasContas.get(i);
            if (c != contaOrigem) {
                System.out.println((i + 1) + ". " + c.getCliente().getNome() + " (Conta: " + c.getNumero() + ")");
            }
        }
        System.out.print("Selecione a conta destino (número): ");
        try {
            int destinoIdx = scanner.nextInt() - 1;
            if (destinoIdx >= 0 && destinoIdx < todasContas.size() && todasContas.get(destinoIdx) != contaOrigem) {
                System.out.print("Valor a transferir: R$ ");
                double valor = scanner.nextDouble();
                if (contaOrigem.transferir(todasContas.get(destinoIdx), valor)) {
                    System.out.println(GREEN + "Transferência realizada com sucesso!" + RESET);
                } else {
                    System.out.println(RED + "Transferência falhou! Verifique saldo ou valor." + RESET);
                }
            } else {
                System.out.println(RED + "Conta inválida!" + RESET);
            }
        } catch (InputMismatchException e) {
            System.out.println(RED + "Entrada inválida!" + RESET);
            scanner.nextLine();
        }
    }

    private void exibirHistorico(List<String> historico) {
        if (historico.isEmpty()) {
            System.out.println("Nenhuma transação registrada.");
        } else {
            System.out.println("Histórico de Transações:");
            for (String transacao : historico) {
                System.out.println("- " + transacao);
            }
        }
    }
}