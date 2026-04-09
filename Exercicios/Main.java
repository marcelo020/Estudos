import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Criar agências
        Agencia agencia1 = new Agencia();
        agencia1.setNumero(1);
        agencia1.setUf("SP");

        Agencia agencia2 = new Agencia();
        agencia2.setNumero(2);
        agencia2.setUf("RJ");

        // Criar clientes para agencia1
        Cliente cliente1 = new Cliente();
        cliente1.setNome("João Silva");
        cliente1.setCodigo(101);

        Cliente cliente2 = new Cliente();
        cliente2.setNome("Maria Santos");
        cliente2.setCodigo(102);

        // Criar contas para clientes de agencia1
        Conta conta1 = new Conta();
        conta1.setNumero(1001);
        conta1.setSaldo(500.0);
        conta1.setAgencia(agencia1);
        conta1.setCliente(cliente1);

        Conta conta2 = new Conta();
        conta2.setNumero(1002);
        conta2.setSaldo(300.0);
        conta2.setAgencia(agencia1);
        conta2.setCliente(cliente2);

        // Criar cartões para clientes de agencia1
        CartaoDeCredito cartao1 = new CartaoDeCredito();
        cartao1.setNumero(123456789);
        cartao1.setDataDeValidade("12/2025");
        cartao1.setCliente(cliente1);

        CartaoDeCredito cartao2 = new CartaoDeCredito();
        cartao2.setNumero(987654321);
        cartao2.setDataDeValidade("11/2025");
        cartao2.setCliente(cliente2);

        // Criar clientes para agencia2
        Cliente cliente3 = new Cliente();
        cliente3.setNome("Pedro Oliveira");
        cliente3.setCodigo(201);

        Cliente cliente4 = new Cliente();
        cliente4.setNome("Ana Costa");
        cliente4.setCodigo(202);

        // Criar contas para clientes de agencia2
        Conta conta3 = new Conta();
        conta3.setNumero(2001);
        conta3.setSaldo(700.0);
        conta3.setAgencia(agencia2);
        conta3.setCliente(cliente3);

        Conta conta4 = new Conta();
        conta4.setNumero(2002);
        conta4.setSaldo(1000.0);
        conta4.setAgencia(agencia2);
        conta4.setCliente(cliente4);

        // Criar cartões para clientes de agencia2
        CartaoDeCredito cartao3 = new CartaoDeCredito();
        cartao3.setNumero(111111111);
        cartao3.setDataDeValidade("10/2025");
        cartao3.setCliente(cliente3);

        CartaoDeCredito cartao4 = new CartaoDeCredito();
        cartao4.setNumero(222222222);
        cartao4.setDataDeValidade("09/2025");
        cartao4.setCliente(cliente4);

        // Lista de contas e cartões para facilitar seleção
        List<Conta> contas = new ArrayList<>();
        contas.add(conta1);
        contas.add(conta2);
        contas.add(conta3);
        contas.add(conta4);

        List<CartaoDeCredito> cartoes = new ArrayList<>();
        cartoes.add(cartao1);
        cartoes.add(cartao2);
        cartoes.add(cartao3);
        cartoes.add(cartao4);

        // Caixa Eletrônico
        CaixaEletronico caixa = new CaixaEletronico();
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.println("\n=== Sistema Bancário ===");
            System.out.println("Clientes disponíveis:");
            for (int i = 0; i < contas.size(); i++) {
                Conta c = contas.get(i);
                System.out.println((i + 1) + ". " + c.getCliente().getNome() + " (Agência: " + c.getAgencia().getNumero() + ")");
            }
            System.out.println("5. Sair");
            System.out.print("Selecione um cliente (digite o número): ");
            int escolha = scanner.nextInt();

            if (escolha == 5) break;

            if (escolha < 1 || escolha > contas.size()) {
                System.out.println("Opção inválida!");
                continue;
            }

            Conta contaSelecionada = contas.get(escolha - 1);
            CartaoDeCredito cartaoSelecionado = cartoes.get(escolha - 1);

            while (true) {
                System.out.println("\nCliente: " + contaSelecionada.getCliente().getNome());
                System.out.println("1. Operações na Conta");
                System.out.println("2. Operações no Cartão");
                System.out.println("3. Voltar");
                System.out.print("Escolha: ");
                int op = scanner.nextInt();

                if (op == 1) {
                    caixa.menuConta(contaSelecionada, contas);
                } else if (op == 2) {
                    caixa.menuCartao(cartaoSelecionado);
                } else if (op == 3) {
                    break;
                } else {
                    System.out.println("Opção inválida!");
                }
            }
        }

        System.out.println("Sistema encerrado.");
        scanner.close();
    }
}